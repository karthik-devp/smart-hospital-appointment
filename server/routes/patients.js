const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// Get all patients
router.get('/', (req, res) => {
  const db = getDb();
  db.all('SELECT * FROM patients ORDER BY name', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get patient by ID
router.get('/:id', (req, res) => {
  const db = getDb();
  db.get('SELECT * FROM patients WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(row);
  });
});

// Create patient
router.post('/', (req, res) => {
  const db = getDb();
  const { name, email, phone, age, is_senior_citizen, is_vip } = req.body;

  db.run(
    `INSERT INTO patients (name, email, phone, age, is_senior_citizen, is_vip)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, email, phone, age, is_senior_citizen ? 1 : 0, is_vip ? 1 : 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, name, email, phone, age, is_senior_citizen, is_vip });
    }
  );
});

module.exports = router;
