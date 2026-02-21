const { getDb } = require('../database');

// Predict consultation time based on multiple factors
async function predictConsultationTime(doctorId, patientId, visitType) {
  const db = getDb();
  
  return new Promise((resolve, reject) => {
    // Get doctor's average consultation time
    db.get(
      `SELECT consultation_time_avg FROM doctors WHERE id = ?`,
      [doctorId],
      async (err, doctor) => {
        if (err) {
          reject(err);
          return;
        }

        let baseTime = doctor?.consultation_time_avg || 15;

        // Get patient's historical average
        const patientHistory = await getPatientHistory(patientId, doctorId);
        if (patientHistory.length > 0) {
          const avgPatientTime = patientHistory.reduce((sum, h) => sum + h.actual_duration, 0) / patientHistory.length;
          baseTime = (baseTime + avgPatientTime) / 2; // Average of doctor and patient history
        }

        // Adjust based on visit type
        const visitTypeMultiplier = getVisitTypeMultiplier(visitType);
        baseTime = Math.round(baseTime * visitTypeMultiplier);

        // Get historical average for this doctor-visit type combination
        const doctorVisitHistory = await getDoctorVisitTypeHistory(doctorId, visitType);
        if (doctorVisitHistory.length > 0) {
          const avgVisitTime = doctorVisitHistory.reduce((sum, h) => sum + h.actual_duration, 0) / doctorVisitHistory.length;
          baseTime = Math.round((baseTime + avgVisitTime) / 2);
        }

        resolve(Math.max(10, baseTime)); // Minimum 10 minutes
      }
    );
  });
}

function getVisitTypeMultiplier(visitType) {
  const multipliers = {
    'consultation': 1.0,
    'follow-up': 0.8,
    'checkup': 0.9,
    'emergency': 1.5,
    'procedure': 2.0,
    'review': 0.7
  };
  return multipliers[visitType?.toLowerCase()] || 1.0;
}

function getPatientHistory(patientId, doctorId) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT actual_duration FROM consultation_history 
       WHERE patient_id = ? AND doctor_id = ? 
       ORDER BY created_at DESC LIMIT 10`,
      [patientId, doctorId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
}

function getDoctorVisitTypeHistory(doctorId, visitType) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT actual_duration FROM consultation_history 
       WHERE doctor_id = ? AND visit_type = ? 
       ORDER BY created_at DESC LIMIT 20`,
      [doctorId, visitType],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
}

module.exports = { predictConsultationTime };
