const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// Get all doctors
router.get('/', (req, res) => {
  const db = getDb();
  db.all('SELECT * FROM doctors ORDER BY name', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get doctor by ID
router.get('/:id', (req, res) => {
  const db = getDb();
  db.get('SELECT * FROM doctors WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.json(row);
  });
});

module.exports = router;
