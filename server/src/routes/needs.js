const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { calculateScore } = require('../services/scoringService');

const router = express.Router();

/**
 * @route   POST /api/needs
 * @desc    Create a new community need
 * @access  Private (Field Worker / Coordinator)
 */
router.post('/', auth, async (req, res) => {
  const { title, description, need_type, lat, lng, ward, district, people_affected, is_disaster_zone } = req.body;

  try {
    const urgency_score = calculateScore({
      need_type,
      people_affected,
      is_disaster_zone,
      created_at: new Date()
    });

    const [needId] = await db.transaction(async (trx) => {
      const [need] = await trx('needs')
        .insert({
          title,
          description,
          need_type,
          ward,
          district,
          people_affected,
          urgency_score,
          is_disaster_zone,
          reported_by: req.user.id,
          status: 'open'
        })
        .returning('id');

      const id = need.id || need;

      // Set PostGIS location
      await trx.raw(
        `UPDATE needs SET location = ST_SetSRID(ST_MakePoint(?, ?), 4326) WHERE id = ?`,
        [lng, lat, id]
      );

      return [id];
    });

    const fullNeed = await db('needs').where({ id: needId }).first();
    res.status(201).json(fullNeed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/needs
 * @desc    Get all needs with filters
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  const { status, district, need_type, min_urgency } = req.query;

  try {
    let query = db('needs')
      .select('id', 'title', 'need_type', 'urgency_score', 'status', 'ward', 'district', 'created_at')
      .select(db.raw('ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat'));

    if (status) query.where({ status });
    if (district) query.where({ district });
    if (need_type) query.where({ need_type });
    if (min_urgency) query.where('urgency_score', '>=', min_urgency);

    const needs = await query.orderBy('urgency_score', 'desc');
    res.json(needs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/needs/heatmap
 * @desc    Get needs data for heatmap rendering
 */
router.get('/heatmap', async (req, res) => {
  try {
    const data = await db('needs')
      .select('urgency_score')
      .select(db.raw('ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat'))
      .whereNot('status', 'completed');
    
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/needs/:id
 * @desc    Get single need details
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const need = await db('needs')
      .where({ id: req.params.id })
      .select('*')
      .select(db.raw('ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat'))
      .first();

    if (!need) return res.status(404).json({ message: 'Need not found' });
    res.json(need);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PATCH /api/needs/:id/status
 * @desc    Update need status
 * @access  Private (Coordinator only)
 */
router.patch('/:id/status', auth, async (req, res) => {
  if (req.user.role !== 'coordinator') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { status } = req.body;

  try {
    await db('needs').where({ id: req.params.id }).update({ status, updated_at: new Date() });
    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

const { findMatches } = require('../services/matchingService');

/**
 * @route   GET /api/needs/:id/matches
 * @desc    Get top 3 matching volunteers for a need
 * @access  Private (Coordinator)
 */
router.get('/:id/matches', auth, async (req, res) => {
  if (req.user.role !== 'coordinator') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const matches = await findMatches(req.params.id);
    res.json(matches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

module.exports = router;
