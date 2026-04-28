const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const prisma = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Tool Definitions (Gemini Function Calling) ─────────────────────────

const tools = [
  {
    functionDeclarations: [
      {
        name: 'checkReportStatus',
        description: 'Checks the status of a community need report by phone number or report ID',
        parameters: {
          type: 'OBJECT',
          properties: {
            identifier: {
              type: 'STRING',
              description: 'Phone number (e.g. 9876543210) or the report UUID'
            }
          },
          required: ['identifier']
        }
      },
      {
        name: 'getAnalytics',
        description: 'Returns live statistics for coordinators. E.g. count of open needs by type or district.',
        parameters: {
          type: 'OBJECT',
          properties: {
            need_type: {
              type: 'STRING',
              description: 'Filter by type: medical, food, shelter, rescue, accidental, other. Leave empty for all.'
            },
            district: {
              type: 'STRING',
              description: 'Filter by district name. Leave empty for all districts.'
            },
            status: {
              type: 'STRING',
              description: 'Filter by status: open, pending, assigned, in_progress, completed'
            }
          }
        }
      },
      {
        name: 'getEscalatedNeeds',
        description: 'Returns a list of needs that have been pending for over 30 minutes with no volunteer accepting',
        parameters: { type: 'OBJECT', properties: {} }
      }
    ]
  }
];

// ── Tool Executors ─────────────────────────────────────────────────────

async function executeTool(name, args) {
  if (name === 'checkReportStatus') {
    const { identifier } = args;
    const isUUID = /^[0-9a-f-]{36}$/i.test(identifier);

    let rows;
    if (isUUID) {
      rows = await prisma.$queryRaw`
        SELECT title, status, ward, district, need_type, created_at, urgency_score
        FROM needs WHERE id = ${identifier}::uuid LIMIT 1
      `;
    } else {
      // Search by contact_number
      rows = await prisma.$queryRaw`
        SELECT title, status, ward, district, need_type, created_at, urgency_score
        FROM needs WHERE contact_number = ${identifier} ORDER BY created_at DESC LIMIT 1
      `;
    }

    if (!rows || rows.length === 0) {
      return { found: false, message: 'No report found for the given identifier.' };
    }
    return { found: true, report: rows[0] };
  }

  if (name === 'getAnalytics') {
    const { need_type, district, status } = args;
    const conditions = [`status != 'completed'`];
    if (need_type) conditions.push(`need_type = '${need_type}'`);
    if (district) conditions.push(`district ILIKE '%${district}%'`);
    if (status) conditions.push(`status = '${status}'`);

    const where = conditions.join(' AND ');
    const rows = await prisma.$queryRawUnsafe(`
      SELECT need_type, status, COUNT(*)::int as count
      FROM needs WHERE ${where}
      GROUP BY need_type, status
      ORDER BY count DESC
    `);
    return { analytics: rows };
  }

  if (name === 'getEscalatedNeeds') {
    const rows = await prisma.need.findMany({
      where: { isEscalated: true, status: { in: ['pending', 'open'] } },
      select: { id: true, title: true, district: true, ward: true, needType: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
      take: 10
    });
    return { escalated: rows, count: rows.length };
  }

  return { error: 'Unknown tool' };
}

// ── System Prompt ──────────────────────────────────────────────────────

function buildSystemPrompt(userRole) {
  return `
You are SevaBot, the intelligent assistant for SevaSetu — a real-time volunteer coordination platform for disaster relief and community aid in India.

YOUR ROLE CONTEXT: The current user has role: "${userRole}".

STRICT RULES:
1. You CANNOT accept incident reports. If anyone tries to report an emergency, say: "For safety, all reports must go through the official 'Report Incident' form to ensure GPS verification. Please click the Report button in the navigation."
2. You CANNOT deploy or assign volunteers.
3. You CANNOT provide medical diagnoses. You may provide basic first-aid information only.
4. Always be warm, concise, and empathetic. People may be in distress.
5. If you don't know something, say so honestly.

PLATFORM KNOWLEDGE:
- SevaSetu connects citizens in need with verified volunteers in real-time
- Reports require live photo + GPS verification to prevent fraud
- Volunteers are automatically notified within a 7km radius when a need is reported
- Coordinators manage escalated cases (needs not accepted within 30 minutes)
- Volunteer roles require coordinator approval
- WhatsApp reporting is available by sending "REPORT" to our WhatsApp number

FIRST AID KNOWLEDGE (use only if asked):
- Bleeding: Apply firm pressure with a clean cloth for 10 minutes. Do not remove the cloth.
- Burns: Cool with running water for 20 minutes. Do not use ice.
- Drowning: Call 112 immediately. Begin CPR if trained.
- Cardiac arrest: Call 112, begin chest compressions 30:2 ratio if trained.
- Flood safety: Move to higher ground. Do not walk through moving water.
- Emergency water: Boil for 1 minute, or use water purification tablets.

SOP FOR VOLUNTEERS:
- If a report seems fake: Document it, do not confront, report to coordinator.
- Check-in GPS must match the need location within 1km.
- Completion requires a photo uploaded through the app.

COORDINATOR CONTACTS: Direct users to check the platform's Coordinators page for current contact details.
`.trim();
}

// ── Chat Endpoint ──────────────────────────────────────────────────────

/**
 * @route   POST /api/chat
 * @desc    SevaBot chat endpoint with Gemini Function Calling
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: buildSystemPrompt(req.user.role),
      tools
    });

    // Build chat history from client-provided array
    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    let result = await chat.sendMessage(message);
    let response = result.response;

    // Handle Function Calling loop
    while (response.functionCalls && response.functionCalls().length > 0) {
      const calls = response.functionCalls();
      const functionResults = [];

      for (const call of calls) {
        console.log(`[SevaBot] Calling tool: ${call.name}`, call.args);
        const toolResult = await executeTool(call.name, call.args);
        functionResults.push({
          functionResponse: {
            name: call.name,
            response: toolResult
          }
        });
      }

      // Send tool results back to Gemini
      result = await chat.sendMessage(functionResults);
      response = result.response;
    }

    const replyText = response.text();
    res.json({ reply: replyText });

  } catch (err) {
    console.error('[SevaBot] Error:', err.message);
    res.status(500).json({ error: 'SevaBot is temporarily unavailable. Please try again.' });
  }
});

module.exports = router;
