const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { sendNotification } = require('../utils/notificationService');

// Get notifications for a patient
router.get('/patient/:patientId', (req, res) => {
  const db = getDb();
  db.all(
    `SELECT * FROM notifications 
     WHERE patient_id = ? 
     ORDER BY created_at DESC 
     LIMIT 50`,
    [req.params.patientId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Trigger notification manually (for testing)
router.post('/trigger', async (req, res) => {
  const { patient_id, appointment_id, type, message, channels } = req.body;

  try {
    await sendNotification(
      patient_id,
      appointment_id,
      type,
      message || getDefaultMessage(type),
      channels || ['email']
    );
    res.json({ success: true, message: 'Notification sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function getDefaultMessage(type) {
  const messages = {
    'doctor_delay': 'We apologize for the delay. Your doctor is running behind schedule.',
    'turn_soon': 'Your turn is coming up in approximately 10 minutes. Please be ready.',
    'lab_report': 'Your lab report is now available. Please check your email or patient portal.',
    'appointment_reminder': 'This is a reminder about your upcoming appointment.',
    'queue_update': 'Your queue position has been updated.'
  };
  return messages[type] || 'You have a new notification from the hospital.';
}

module.exports = router;
