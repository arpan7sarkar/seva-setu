const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/volunteers
 * @desc    List all volunteers
 * @access  Private (Coordinator)
 */
router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'coordinator') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const volunteers = await db('volunteers as v')
      .join('users as u', 'v.user_id', 'u.id')
      .select('u.id', 'u.name', 'u.email', 'v.skills', 'v.is_available', 'v.tasks_completed', 'v.completion_rate')
      .select(db.raw('ST_X(v.location::geometry) as lng, ST_Y(v.location::geometry) as lat'));

    res.json(volunteers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PATCH /api/volunteers/me/availability
 * @desc    Toggle availability
 */
router.patch('/me/availability', auth, async (req, res) => {
  const { is_available } = req.body;

  try {
    await db('volunteers').where({ user_id: req.user.id }).update({ is_available });
    res.json({ message: 'Availability updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PATCH /api/volunteers/me/location
 * @desc    Update volunteer GPS location
 */
router.patch('/me/location', auth, async (req, res) => {
  const { lat, lng } = req.body;

  try {
    await db.raw(
      `UPDATE volunteers SET location = ST_SetSRID(ST_MakePoint(?, ?), 4326) WHERE user_id = ?`,
      [lng, lat, req.user.id]
    );
    res.json({ message: 'Location updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/volunteers/me/stats
 * @desc    Get current volunteer stats
 */
router.get('/me/stats', auth, async (req, res) => {
  try {
    const stats = await db('volunteers').where({ user_id: req.user.id }).first();
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
