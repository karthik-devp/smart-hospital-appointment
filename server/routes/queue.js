const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { sendNotification } = require('../utils/notificationService');

module.exports = (io) => {
  // Get queue for a doctor
  router.get('/doctor/:doctorId', (req, res) => {
    const db = getDb();
    db.all(
      `SELECT q.*, a.priority_score, a.priority_level, a.visit_type, a.appointment_date,
              p.name as patient_name, p.phone as patient_phone, p.is_senior_citizen, p.is_vip
       FROM queue q
       JOIN appointments a ON q.appointment_id = a.id
       JOIN patients p ON a.patient_id = p.id
       WHERE q.doctor_id = ? AND q.status = 'waiting'
       ORDER BY a.priority_score DESC, q.position ASC`,
      [req.params.doctorId],
      async (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Calculate wait times
        const queueWithWaitTimes = await Promise.all(
          rows.map(async (item, index) => {
            const waitTime = await calculateWaitTime(req.params.doctorId, item.position);
            return { ...item, estimated_wait_time: waitTime };
          })
        );

        res.json(queueWithWaitTimes);
      }
    );
  });

  // Call next patient
  router.post('/call-next/:doctorId', async (req, res) => {
    const db = getDb();
    
    try {
      // Get next patient in queue
      const nextPatient = await new Promise((resolve, reject) => {
        db.get(
          `SELECT q.*, a.patient_id, p.name as patient_name, p.phone
           FROM queue q
           JOIN appointments a ON q.appointment_id = a.id
           JOIN patients p ON a.patient_id = p.id
           WHERE q.doctor_id = ? AND q.status = 'waiting'
           ORDER BY a.priority_score DESC, q.position ASC
           LIMIT 1`,
          [req.params.doctorId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!nextPatient) {
        return res.status(404).json({ error: 'No patients in queue' });
      }

      // Update queue status
      db.run(
        `UPDATE queue SET status = 'called', called_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [nextPatient.id],
        async function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Send notification
          const message = `Dr. ${await getDoctorName(req.params.doctorId)} is ready to see you. Please proceed to the consultation room.`;
          await sendNotification(
            nextPatient.patient_id,
            nextPatient.appointment_id,
            'turn_soon',
            message,
            ['sms', 'push']
          );

          // Emit real-time update
          io.emit('queue_updated', { doctorId: req.params.doctorId, action: 'called', patientId: nextPatient.patient_id });

          res.json({ success: true, patient: nextPatient });
        }
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mark patient as served
  router.post('/serve/:queueId', async (req, res) => {
    const db = getDb();
    const { actual_duration } = req.body;

    try {
      // Get queue item
      const queueItem = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM queue WHERE id = ?', [req.params.queueId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!queueItem) {
        return res.status(404).json({ error: 'Queue item not found' });
      }

      // Update queue
      db.run(
        `UPDATE queue SET status = 'served', served_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [req.params.queueId],
        async function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Update appointment
          if (actual_duration) {
            db.run(
              `UPDATE appointments SET status = 'completed', actual_duration = ? WHERE id = ?`,
              [actual_duration, queueItem.appointment_id]
            );

            // Save to history
            const appointment = await new Promise((resolve, reject) => {
              db.get('SELECT * FROM appointments WHERE id = ?', [queueItem.appointment_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
              });
            });

            if (appointment) {
              db.run(
                `INSERT INTO consultation_history (appointment_id, doctor_id, patient_id, visit_type, actual_duration)
                 VALUES (?, ?, ?, ?, ?)`,
                [queueItem.appointment_id, appointment.doctor_id, appointment.patient_id, appointment.visit_type, actual_duration]
              );
            }
          }

          // Recalculate positions for remaining patients
          await recalculatePositions(queueItem.doctor_id);

          // Emit real-time update
          io.emit('queue_updated', { doctorId: queueItem.doctor_id, action: 'served' });

          res.json({ success: true });
        }
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get patient's queue status
  router.get('/patient/:patientId', (req, res) => {
    const db = getDb();
    db.get(
      `SELECT q.*, a.priority_score, a.priority_level, a.visit_type,
              d.name as doctor_name, d.specialization
       FROM queue q
       JOIN appointments a ON q.appointment_id = a.id
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.patient_id = ? AND q.status = 'waiting'
       ORDER BY q.position ASC
       LIMIT 1`,
      [req.params.patientId],
      async (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (!row) {
          return res.json({ message: 'No active queue position' });
        }

        // Calculate wait time
        const waitTime = await calculateWaitTime(row.doctor_id, row.position);
        const patientsAhead = row.position - 1;

        res.json({
          ...row,
          estimated_wait_time: waitTime,
          patients_ahead: patientsAhead
        });
      }
    );
  });

  return router;
};

async function calculateWaitTime(doctorId, position) {
  const db = getDb();
  
  return new Promise((resolve, reject) => {
    // Get all patients ahead in queue
    db.all(
      `SELECT a.estimated_duration 
       FROM queue q
       JOIN appointments a ON q.appointment_id = a.id
       WHERE q.doctor_id = ? AND q.status = 'waiting' AND q.position < ?
       ORDER BY q.position ASC`,
      [doctorId, position],
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        const totalWaitTime = rows.reduce((sum, row) => sum + (row.estimated_duration || 15), 0);
        resolve(totalWaitTime);
      }
    );
  });
}

async function recalculatePositions(doctorId) {
  const db = getDb();
  
  return new Promise((resolve, reject) => {
    // Get all waiting patients ordered by priority
    db.all(
      `SELECT q.id, a.priority_score
       FROM queue q
       JOIN appointments a ON q.appointment_id = a.id
       WHERE q.doctor_id = ? AND q.status = 'waiting'
       ORDER BY a.priority_score DESC, q.position ASC`,
      [doctorId],
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        // Update positions
        let position = 1;
        const updatePromises = rows.map(row => {
          return new Promise((resolve, reject) => {
            db.run('UPDATE queue SET position = ? WHERE id = ?', [position++, row.id], (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        });

        Promise.all(updatePromises).then(() => resolve()).catch(reject);
      }
    );
  });
}

function getDoctorName(doctorId) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get('SELECT name FROM doctors WHERE id = ?', [doctorId], (err, row) => {
      if (err) reject(err);
      else resolve(row?.name || 'Doctor');
    });
  });
}
