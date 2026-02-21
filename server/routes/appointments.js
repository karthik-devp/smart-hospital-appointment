const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { calculatePriorityScore } = require('../utils/priorityCalculator');
const { predictConsultationTime } = require('../utils/timePredictor');
const { sendNotification } = require('../utils/notificationService');

module.exports = (io) => {
  // Create new appointment
  router.post('/', async (req, res) => {
    const db = getDb();
    const { patient_id, doctor_id, appointment_date, visit_type, priority_level, notes } = req.body;

    try {
      // Get patient details for priority calculation
      const patient = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM patients WHERE id = ?', [patient_id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      // Predict consultation time
      const estimated_duration = await predictConsultationTime(doctor_id, patient_id, visit_type);

      // Calculate priority score
      const appointmentData = {
        appointment_date,
        priority_level: priority_level || 'ROUTINE'
      };
      const priority_score = calculatePriorityScore(appointmentData, patient);

      // Create appointment
      db.run(
        `INSERT INTO appointments 
         (patient_id, doctor_id, appointment_date, visit_type, priority_level, priority_score, estimated_duration, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [patient_id, doctor_id, appointment_date, visit_type, priority_level || 'ROUTINE', priority_score, estimated_duration, notes],
        async function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          const appointmentId = this.lastID;

          // Add to queue
          await addToQueue(appointmentId, doctor_id, estimated_duration);

          // Send confirmation notification
          const message = `Your appointment with Dr. ${await getDoctorName(doctor_id)} is scheduled for ${new Date(appointment_date).toLocaleString()}`;
          await sendNotification(patient_id, appointmentId, 'appointment_reminder', message, ['email']);

          // Emit real-time update
          io.emit('appointment_created', { appointmentId, doctor_id });

          res.json({
            id: appointmentId,
            patient_id,
            doctor_id,
            appointment_date,
            visit_type,
            priority_level: priority_level || 'ROUTINE',
            priority_score,
            estimated_duration,
            status: 'scheduled'
          });
        }
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all appointments
  router.get('/', (req, res) => {
    const db = getDb();
    const { doctor_id, patient_id, status, date } = req.query;

    let query = `
      SELECT a.*, p.name as patient_name, p.phone as patient_phone, p.email as patient_email,
             d.name as doctor_name, d.specialization
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (doctor_id) {
      query += ' AND a.doctor_id = ?';
      params.push(doctor_id);
    }
    if (patient_id) {
      query += ' AND a.patient_id = ?';
      params.push(patient_id);
    }
    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }
    if (date) {
      query += ' AND DATE(a.appointment_date) = DATE(?)';
      params.push(date);
    }

    query += ' ORDER BY a.priority_score DESC, a.appointment_date ASC';

    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  });

  // Get appointment by ID
  router.get('/:id', (req, res) => {
    const db = getDb();
    db.get(
      `SELECT a.*, p.name as patient_name, p.phone as patient_phone, p.email as patient_email,
              d.name as doctor_name, d.specialization
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.id = ?`,
      [req.params.id],
      (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (!row) {
          return res.status(404).json({ error: 'Appointment not found' });
        }
        res.json(row);
      }
    );
  });

  // Update appointment status
  router.patch('/:id/status', async (req, res) => {
    const db = getDb();
    const { status, actual_duration } = req.body;

    try {
      // Get appointment details
      const appointment = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM appointments WHERE id = ?', [req.params.id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      db.run(
        `UPDATE appointments SET status = ?, actual_duration = ? WHERE id = ?`,
        [status, actual_duration || appointment.actual_duration, req.params.id],
        async function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Save to consultation history if completed
          if (status === 'completed' && actual_duration) {
            db.run(
              `INSERT INTO consultation_history (appointment_id, doctor_id, patient_id, visit_type, actual_duration)
               VALUES (?, ?, ?, ?, ?)`,
              [req.params.id, appointment.doctor_id, appointment.patient_id, appointment.visit_type, actual_duration]
            );
          }

          // Emit real-time update
          io.emit('appointment_updated', { appointmentId: req.params.id, status });

          res.json({ success: true, status });
        }
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};

async function addToQueue(appointmentId, doctorId, estimatedDuration) {
  const db = getDb();
  
  return new Promise((resolve, reject) => {
    // Get current queue position
    db.get(
      `SELECT MAX(position) as max_position FROM queue WHERE doctor_id = ? AND status = 'waiting'`,
      [doctorId],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        const position = (row?.max_position || 0) + 1;
        
        // Calculate estimated wait time
        db.all(
          `SELECT estimated_duration FROM queue WHERE doctor_id = ? AND status = 'waiting' ORDER BY position`,
          [doctorId],
          (err, waitingAppointments) => {
            if (err) {
              reject(err);
              return;
            }

            const estimatedWaitTime = waitingAppointments.reduce((sum, apt) => sum + (apt.estimated_duration || 15), 0);

            db.run(
              `INSERT INTO queue (appointment_id, doctor_id, position, estimated_wait_time, status)
               VALUES (?, ?, ?, ?, 'waiting')`,
              [appointmentId, doctorId, position, estimatedWaitTime],
              function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
              }
            );
          }
        );
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
