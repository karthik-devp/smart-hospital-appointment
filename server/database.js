const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'hospital.db');

let db;

function initDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
      } else {
        console.log('Connected to SQLite database');
        createTables(resolve);
      }
    });
  });
}

function createTables(callback) {
  let completed = 0;
  const totalTables = 6;
  
  const checkComplete = () => {
    completed++;
    if (completed === totalTables) {
      insertSampleData(callback);
    }
  };

  // Doctors table
  db.run(`CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    consultation_time_avg INTEGER DEFAULT 15,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, checkComplete);

  // Patients table
  db.run(`CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    age INTEGER,
    is_senior_citizen INTEGER DEFAULT 0,
    is_vip INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, checkComplete);

  // Appointments table
  db.run(`CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    appointment_date DATETIME NOT NULL,
    visit_type TEXT NOT NULL,
    priority_level TEXT NOT NULL,
    priority_score REAL DEFAULT 0,
    estimated_duration INTEGER,
    actual_duration INTEGER,
    status TEXT DEFAULT 'scheduled',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
  )`, checkComplete);

  // Queue table
  db.run(`CREATE TABLE IF NOT EXISTS queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    position INTEGER NOT NULL,
    estimated_wait_time INTEGER,
    called_at DATETIME,
    served_at DATETIME,
    status TEXT DEFAULT 'waiting',
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
  )`, checkComplete);

  // Notifications table
  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    appointment_id INTEGER,
    type TEXT NOT NULL,
    channel TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
  )`, checkComplete);

  // Historical data for prediction
  db.run(`CREATE TABLE IF NOT EXISTS consultation_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    visit_type TEXT NOT NULL,
    actual_duration INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  )`, checkComplete);
}

function insertSampleData(callback) {
  let completed = 0;
  const totalInserts = 2;
  
  const checkComplete = () => {
    completed++;
    if (completed === totalInserts && callback) {
      console.log('Sample data inserted');
      callback();
    }
  };

  // Sample doctors
  db.run(`INSERT OR IGNORE INTO doctors (id, name, specialization, email, phone, consultation_time_avg) VALUES
    (1, 'Dr. Sarah Johnson', 'Cardiology', 'sarah.j@hospital.com', '+1234567890', 20),
    (2, 'Dr. Michael Chen', 'Pediatrics', 'michael.c@hospital.com', '+1234567891', 15),
    (3, 'Dr. Emily Rodriguez', 'General Medicine', 'emily.r@hospital.com', '+1234567892', 18),
    (4, 'Dr. James Wilson', 'Orthopedics', 'james.w@hospital.com', '+1234567893', 25)`, checkComplete);

  // Sample patients
  db.run(`INSERT OR IGNORE INTO patients (id, name, email, phone, age, is_senior_citizen, is_vip) VALUES
    (1, 'John Doe', 'john.doe@email.com', '+1987654321', 45, 0, 0),
    (2, 'Jane Smith', 'jane.smith@email.com', '+1987654322', 72, 1, 0),
    (3, 'Robert Brown', 'robert.b@email.com', '+1987654323', 35, 0, 1)`, checkComplete);
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Please wait for initialization to complete.');
  }
  return db;
}

module.exports = { initDatabase, getDb };
