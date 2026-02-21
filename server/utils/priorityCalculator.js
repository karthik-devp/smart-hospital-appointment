// Priority scoring system with weighted logic
const PRIORITY_WEIGHTS = {
  EMERGENCY: 1000,
  FOLLOW_UP: 200,
  SENIOR_CITIZEN: 150,
  VIP: 300,
  ROUTINE: 50
};

function calculatePriorityScore(appointment, patient) {
  let score = 0;
  const priorityLevel = appointment.priority_level?.toUpperCase();

  // Base priority score
  switch (priorityLevel) {
    case 'EMERGENCY':
      score += PRIORITY_WEIGHTS.EMERGENCY;
      break;
    case 'FOLLOW_UP':
      score += PRIORITY_WEIGHTS.FOLLOW_UP;
      break;
    case 'ROUTINE':
      score += PRIORITY_WEIGHTS.ROUTINE;
      break;
    default:
      score += PRIORITY_WEIGHTS.ROUTINE;
  }

  // Senior citizen bonus
  if (patient.is_senior_citizen) {
    score += PRIORITY_WEIGHTS.SENIOR_CITIZEN;
  }

  // VIP bonus
  if (patient.is_vip) {
    score += PRIORITY_WEIGHTS.VIP;
  }

  // Time-based adjustment (earlier appointments get slight boost)
  const appointmentTime = new Date(appointment.appointment_date);
  const now = new Date();
  const hoursUntilAppointment = (appointmentTime - now) / (1000 * 60 * 60);
  
  if (hoursUntilAppointment < 0) {
    score += 100; // Overdue appointments get priority
  } else if (hoursUntilAppointment < 2) {
    score += 50; // Appointments within 2 hours
  }

  return score;
}

module.exports = { calculatePriorityScore, PRIORITY_WEIGHTS };
