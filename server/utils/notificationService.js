const { getDb } = require('../database');
const nodemailer = require('nodemailer');

// Email configuration (configure with your SMTP settings)
let emailTransporter = null;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
} else {
  console.log('Email not configured. SMTP credentials missing. Email notifications will be logged only.');
}

// Send notification through multiple channels
async function sendNotification(patientId, appointmentId, type, message, channels = ['email']) {
  const db = getDb();
  
  const patient = await getPatient(patientId);
  
  if (!patient) {
    throw new Error('Patient not found');
  }

  const notificationPromises = [];

  for (const channel of channels) {
    let sendPromise;
    
    switch (channel.toLowerCase()) {
      case 'email':
        sendPromise = sendEmail(patient.email, type, message);
        break;
      case 'sms':
        sendPromise = sendSMS(patient.phone, message);
        break;
      case 'whatsapp':
        sendPromise = sendWhatsApp(patient.phone, message);
        break;
      case 'push':
        sendPromise = sendPushNotification(patientId, type, message);
        break;
      default:
        console.log(`Unknown channel: ${channel}`);
        continue;
    }

    notificationPromises.push(
      sendPromise.then(() => {
        // Save notification to database
        return saveNotification(patientId, appointmentId, type, channel, message, 'sent');
      }).catch((error) => {
        console.error(`Failed to send ${channel} notification:`, error);
        return saveNotification(patientId, appointmentId, type, channel, message, 'failed');
      })
    );
  }

  await Promise.all(notificationPromises);
}

function sendEmail(email, type, message) {
  if (!email) {
    return Promise.resolve();
  }

  if (!emailTransporter) {
    console.log(`[EMAIL] To: ${email}, Subject: ${getEmailSubject(type)}, Message: ${message}`);
    return Promise.resolve();
  }

  const subject = getEmailSubject(type);
  
  return emailTransporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@hospital.com',
    to: email,
    subject: subject,
    text: message,
    html: `<p>${message}</p>`
  }).catch(err => {
    console.error('Email send error:', err);
    throw err;
  });
}

function sendSMS(phone, message) {
  // Twilio SMS integration (configure with your Twilio credentials)
  // For demo purposes, we'll just log it
  console.log(`SMS to ${phone}: ${message}`);
  return Promise.resolve();
  
  // Uncomment and configure for actual SMS:
  // const twilio = require('twilio');
  // const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  // return client.messages.create({
  //   body: message,
  //   to: phone,
  //   from: process.env.TWILIO_PHONE_NUMBER
  // });
}

function sendWhatsApp(phone, message) {
  // WhatsApp integration (Twilio WhatsApp API or similar)
  // For demo purposes, we'll just log it
  console.log(`WhatsApp to ${phone}: ${message}`);
  return Promise.resolve();
}

function sendPushNotification(patientId, type, message) {
  // Push notification service (Firebase Cloud Messaging, OneSignal, etc.)
  // For demo purposes, we'll just log it
  console.log(`Push notification to patient ${patientId}: ${message}`);
  return Promise.resolve();
}

function getEmailSubject(type) {
  const subjects = {
    'doctor_delay': 'Appointment Delay Notice',
    'turn_soon': 'Your Turn is Coming Soon',
    'lab_report': 'Lab Report Available',
    'appointment_reminder': 'Appointment Reminder',
    'queue_update': 'Queue Update'
  };
  return subjects[type] || 'Hospital Notification';
}

function getPatient(patientId) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM patients WHERE id = ?', [patientId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function saveNotification(patientId, appointmentId, type, channel, message, status) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    const sentAt = status === 'sent' ? new Date().toISOString() : null;
    db.run(
      `INSERT INTO notifications (patient_id, appointment_id, type, channel, message, status, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [patientId, appointmentId, type, channel, message, status, sentAt],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

module.exports = { sendNotification };
