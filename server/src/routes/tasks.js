const express = require('express');
const prisma = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/tasks
 * @desc    Assign a volunteer to a need
 * @access  Private (Coordinator)
 */
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'coordinator') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { need_id, volunteer_id, notes } = req.body;

  try {
    const taskId = await prisma.$transaction(async (tx) => {
      // 1. Create task
      const task = await tx.task.create({
        data: {
          needId: need_id,
          assignedVolunteerId: volunteer_id,
          notes,
          status: 'assigned',
          assignedAt: new Date(),
        },
      });

      // 2. Update need status safely
      await tx.need.update({
        where: { id: need_id },
        data: { status: 'assigned', updatedAt: new Date() },
        select: { id: true },
      });

      return task.id;
    });

    res.status(201).json({ taskId, message: 'Volunteer assigned successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PATCH /api/tasks/:id/checkin
 * @desc    Volunteer GPS check-in
 * @access  Private (Volunteer)
 */
router.patch('/:id/checkin', auth, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { lat, lng } = req.body;

    await prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: req.params.id },
        data: {
          status: 'in_progress',
          checkedInAt: new Date(),
          checkInLat: lat ? Number(lat) : null,
          checkInLng: lng ? Number(lng) : null,
        },
      });

      await tx.need.update({
        where: { id: task.needId },
        data: {
          status: 'in_progress',
          updatedAt: new Date(),
        },
        select: { id: true },
      });
    });

    res.json({ message: 'Checked in successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const exifr = require('exifr');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

/**
 * @route   PATCH /api/tasks/:id/complete
 * @desc    Mark task as completed with proof, EXIF GPS check, and AI semantic verification
 * @access  Private (Volunteer)
 */
router.patch('/:id/complete', auth, upload.single('image'), async (req, res) => {
  console.log(`[task-complete] Request received for Task ID: ${req.params.id}`);
  try {
    const task = await prisma.task.findUnique({ 
      where: { id: req.params.id },
      include: { need: true }
    });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Fetch lat/lng for the need since Prisma geometry doesn't provide them directly
    const needLocation = await prisma.$queryRaw`
      SELECT ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat 
      FROM needs WHERE id = ${task.needId}::uuid
    `;
    const { lat, lng } = needLocation[0] || { lat: 0, lng: 0 };

    const errors = [];  // Geo-tag errors go first, then AI errors
    let isVerified = false;
    let imageUrl = null;

    if (!req.file) {
      return res.status(400).json({ message: 'Proof of completion image is required.' });
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 1: GEO-TAG CHECK (MANDATORY — runs for EVERY image)
    // ═══════════════════════════════════════════════════════════
    let geoTagPassed = false;
    try {
      console.log(`[GEOTAG] Scanning metadata for: ${req.file.originalname} (${req.file.size} bytes)`);
      console.log(`[GEOTAG] Target Incident Location: Lat=${lat}, Lng=${lng}`);

      let photoLat = undefined;
      let photoLng = undefined;

      // Method 1: Full parse (most reliable for all formats)
      try {
        const metadata = await exifr.parse(req.file.buffer, { gps: true });
        if (metadata && typeof metadata.latitude === 'number') {
          photoLat = metadata.latitude;
          photoLng = metadata.longitude;
          console.log(`[GEOTAG] Metadata found: Lat=${photoLat}, Lng=${photoLng}`);
        }
      } catch (e) {
        console.log(`[GEOTAG] Parse failed: ${e.message}`);
      }

      // STEP 1.1: Extract Browser-Side Verification Coords (The "Distance in the Map")
      const browserLat = req.body.browserLat ? Number(req.body.browserLat) : null;
      const browserLng = req.body.browserLng ? Number(req.body.browserLng) : null;
      
      const toRad = (val) => (val * Math.PI) / 180;
      const R = 6371; // Earth's radius in km

      const getDistance = (lat1, lon1, lat2, lon2) => {
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };

      // VERDICT LOGIC: We strictly use the Browser GPS (The "Distance in the Map")
      // This is what the volunteer sees on their screen, so it must be the ground truth.
      if (browserLat !== null && browserLng !== null) {
        const browserDist = getDistance(browserLat, browserLng, Number(lat), Number(lng));
        console.log(`[GEOTAG] Live Map Distance: ${browserDist.toFixed(3)}km`);

        if (browserDist <= 1.0) {
          console.log(`[GEOTAG] ✅ VERDICT: GPS VERIFIED (Map Distance < 1km)`);
          geoTagPassed = true;
        } else {
          console.log(`[GEOTAG] ❌ VERDICT: TOO FAR (${browserDist.toFixed(2)}km)`);
          errors.push(`⚠️ LOCATION MISMATCH: The map shows you are ${browserDist.toFixed(2)}km away. You must be within 1km to submit proof.`);
        }
      } else {
        // Fallback to Photo EXIF only if Browser GPS is somehow unavailable
        console.log(`[GEOTAG] Warning: Browser GPS missing, falling back to Photo EXIF`);
        if (typeof photoLat === 'number' && typeof photoLng === 'number') {
          const photoDist = getDistance(photoLat, photoLng, Number(lat), Number(lng));
          if (photoDist <= 1.0) geoTagPassed = true;
          else errors.push(`⚠️ LOCATION MISMATCH: Photo shows you are ${photoDist.toFixed(2)}km away.`);
        } else {
          errors.push('⚠️ GEO-TAG MISSING: Could not verify your location from the map or photo.');
        }
      }
    } catch (exifErr) {
      console.error(`[GEOTAG] ❌ FATAL ERROR:`, exifErr);
      errors.push('⚠️ GEO-TAG ERROR: Could not read metadata from this image file.');
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 2: AI CONTENT CHECK (ALWAYS runs, even if geo-tag failed)
    // ═══════════════════════════════════════════════════════════
    try {
      // Basic check for empty/black files (less than 15KB is usually junk)
      if (req.file.size < 15000) {
        errors.push('🔍 IMAGE ERROR: The photo appears to be blank or too small. Please capture a clear photo of the disaster site.');
      }

      const form = new FormData();
      form.append('file', req.file.buffer, { filename: req.file.originalname || 'proof.jpg' });
      form.append('need_type', task.need.needType); // CRITICAL: Send the context to AI

      console.log(`[AI-CHECK] Sending image to AI model for analysis (Type: ${task.need.needType})...`);
      const aiResponse = await axios.post(
        `${process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000'}/verify-image`,
        form,
        {
          headers: form.getHeaders(),
          timeout: 20000
        }
      );

      const topMatch = aiResponse.data.top_match.toLowerCase();
      const confidence = aiResponse.data.confidence;
      const needType = task.need.needType.toLowerCase();

      console.log(`[AI-CHECK] Result: "${topMatch}" (confidence: ${(confidence * 100).toFixed(1)}%) | Required: "${needType}"`);

      const isGenuine = aiResponse.data.is_verified && (
        topMatch.includes(needType) ||
        topMatch.includes('help') ||
        topMatch.includes('disaster') ||
        topMatch.includes('emergency')
      );

      if (!isGenuine) {
        const detected = topMatch.replace('a photo of ', '');
        console.log(`[AI-CHECK] ❌ VERDICT: CONTENT DOES NOT MATCH`);
        errors.push(`🔍 IMAGE MISMATCH: AI analysis detected "${detected}" in your photo, but this mission requires proof of "${needType}". Please upload a genuine photo of the work done.`);
      } else {
        isVerified = true;
        console.log(`[AI-CHECK] ✅ VERDICT: CONTENT VERIFIED`);
      }
    } catch (aiErr) {
      console.error(`[AI-CHECK] ❌ Service error:`, aiErr.message);
      errors.push('🔍 AI SERVICE ERROR: The image verification service is temporarily unavailable. Please try again in a moment.');
    }

    // ═══════════════════════════════════════════════════════════
    // FINAL DECISION: Reject if ANY errors exist
    // ═══════════════════════════════════════════════════════════
    if (errors.length > 0) {
      console.log(`[FINAL] Task ${req.params.id} REJECTED with ${errors.length} error(s):`, errors);
      return res.status(400).json({
        message: 'Verification Failed',
        errors: errors,
        details: errors.join(' | '),
        statusSummary: {
          geoTag: geoTagPassed ? 'PASSED' : 'FAILED',
          aiContent: isVerified ? 'PASSED' : 'FAILED'
        }
      });
    }

    // If we reach here, everything is verified
    const fileName = `complete-${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
    const filePath = path.join(UPLOADS_DIR, fileName);
    fs.writeFileSync(filePath, req.file.buffer);
    imageUrl = `/uploads/${fileName}`;

    await prisma.$transaction(async (tx) => {
      // 1. Update task
      await tx.task.update({
        where: { id: req.params.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          completionImageUrl: imageUrl,
          isCompletionVerified: true // Now always true if we reach here
        },
      });

      // 2. Update need
      await tx.need.update({
        where: { id: task.needId },
        data: { status: 'completed', updatedAt: new Date() },
      });

      // 3. Update volunteer stats
      const volunteer = await tx.volunteer.findUnique({
        where: { userId: task.assignedVolunteerId },
        select: { tasksCompleted: true, completionRate: true },
      });

      if (volunteer) {
        const newCompleted = (volunteer.tasksCompleted || 0) + 1;
        const newRate = Math.min(1.0, (volunteer.completionRate || 0) + 0.10); // Always give the +10% verified bonus

        await tx.volunteer.update({
          where: { userId: task.assignedVolunteerId },
          data: { tasksCompleted: newCompleted, completionRate: newRate },
        });
      }
    });

    res.json({ 
      message: 'Verified Completion! Impact bonus awarded.',
      isVerified: true
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/tasks/my
 * @desc    Get assigned tasks for the logged-in volunteer
 */
router.get('/my', auth, async (req, res) => {
  try {
    const tasks = await prisma.$queryRaw`
      SELECT
        t.id as task_id,
        t.status as task_status,
        t.assigned_at,
        t.completed_at,
        t.check_in_lat,
        t.check_in_lng,
        t.is_completion_verified,
        n.title,
        n.need_type,
        n.urgency_score,
        n.ward,
        n.district,
        n.contact_number,
        n.contact_number as "contactNumber",
        n.image_url,
        ST_X(n.location::geometry) as lng,
        ST_Y(n.location::geometry) as lat,
        ST_X(v.location::geometry) as volunteer_lng,
        ST_Y(v.location::geometry) as volunteer_lat,
        CASE WHEN v.location IS NOT NULL AND n.location IS NOT NULL
          THEN ST_Distance(v.location::geography, n.location::geography) / 1000
          ELSE NULL
        END as server_distance_km
      FROM tasks t
      JOIN needs n ON t.need_id = n.id
      LEFT JOIN volunteers v ON v.user_id = t.assigned_volunteer_id
      WHERE t.assigned_volunteer_id = ${req.user.id}::uuid
      ORDER BY t.assigned_at DESC
    `;

    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks for coordinator dashboard
 * @access  Private (Coordinator)
 */
router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'coordinator') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const tasks = await prisma.$queryRaw`
      SELECT
        t.id AS task_id,
        t.status AS task_status,
        t.assigned_at,
        t.checked_in_at,
        t.completed_at,
        t.is_completion_verified AS is_verified,
        t.need_id,
        n.title AS need_title,
        n.status AS need_status,
        u.id AS volunteer_id,
        u.name AS volunteer_name
      FROM tasks t
      JOIN needs n ON t.need_id = n.id
      JOIN users u ON t.assigned_volunteer_id = u.id
      ORDER BY t.assigned_at DESC
    `;

    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
