const express = require('express');
const db = require('../db');
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

  const { need_id, assigned_volunteer_id, notes } = req.body;

  try {
    const taskId = await db.transaction(async (trx) => {
      // 1. Create task
      const [task] = await trx('tasks')
        .insert({
          need_id,
          assigned_volunteer_id,
          notes,
          status: 'assigned',
          assigned_at: new Date()
        })
        .returning('id');

      const id = task.id || task;

      // 2. Update need status
      await trx('needs').where({ id: need_id }).update({ status: 'assigned', updated_at: new Date() });

      return id;
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
    const task = await db('tasks').where({ id: req.params.id }).first();
    if (!task) return res.status(404).json({ message: 'Task not found' });

    await db.transaction(async (trx) => {
      await trx('tasks').where({ id: req.params.id }).update({
        status: 'in_progress',
        checked_in_at: new Date()
      });

      await trx('needs').where({ id: task.need_id }).update({
        status: 'in_progress',
        updated_at: new Date()
      });
    });

    res.json({ message: 'Checked in successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PATCH /api/tasks/:id/complete
 * @desc    Mark task as completed
 * @access  Private (Volunteer)
 */
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const task = await db('tasks').where({ id: req.params.id }).first();
    if (!task) return res.status(404).json({ message: 'Task not found' });

    await db.transaction(async (trx) => {
      // 1. Update task
      await trx('tasks').where({ id: req.params.id }).update({
        status: 'completed',
        completed_at: new Date()
      });

      // 2. Update need
      await trx('needs').where({ id: task.need_id }).update({
        status: 'completed',
        updated_at: new Date()
      });

      // 3. Update volunteer stats
      const volunteer = await trx('volunteers').where({ user_id: task.assigned_volunteer_id }).first();
      const newCompleted = (volunteer.tasks_completed || 0) + 1;
      
      // Simple logic: if they finish, rate goes up. For demo purposes.
      const newRate = Math.min(1.0, (volunteer.completion_rate || 0) + 0.05);

      await trx('volunteers').where({ user_id: task.assigned_volunteer_id }).update({
        tasks_completed: newCompleted,
        completion_rate: newRate
      });
    });

    res.json({ message: 'Task completed! Impact updated.' });
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
    const tasks = await db('tasks as t')
      .join('needs as n', 't.need_id', 'n.id')
      .where({ 't.assigned_volunteer_id': req.user.id })
      .select(
        't.id as task_id',
        't.status as task_status',
        't.assigned_at',
        'n.title',
        'n.need_type',
        'n.urgency_score',
        'n.ward',
        'n.district'
      )
      .select(db.raw('ST_X(n.location::geometry) as lng, ST_Y(n.location::geometry) as lat'))
      .orderBy('t.assigned_at', 'desc');

    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
