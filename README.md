# Smart Hospital Appointment Orchestration System

An intelligent, real-time hospital appointment and patient flow management platform that improves efficiency, reduces wait times, and enhances patient experience.

## Features

### 🏥 Appointment Management
- Schedule and manage doctor appointments
- Track appointment status (scheduled, in-progress, completed)
- View appointment history

### 📊 Smart Queue System
- Intelligent queue management with priority-based ordering
- Real-time queue position updates
- Estimated wait time calculations
- Automatic queue reordering based on priority scores

### 🎯 Priority Levels & Scoring
- **Emergency**: Highest priority (score: 1000)
- **VIP**: High priority (score: 300)
- **Follow-up**: Medium priority (score: 200)
- **Senior Citizens**: Bonus priority (score: +150)
- **Routine**: Standard priority (score: 50)

Priority scoring uses weighted logic that considers:
- Base priority level
- Patient status (senior citizen, VIP)
- Time-based adjustments (overdue appointments get priority boost)

### ⏱️ Consultation Time Prediction
Predicts consultation duration based on:
- Doctor's historical average consultation time
- Patient's previous visit history
- Visit type (consultation, follow-up, emergency, etc.)
- Historical averages for doctor-visit type combinations

### 🔔 Smart Notification System
Multi-channel notifications via:
- **Email**: Appointment reminders, queue updates
- **SMS**: Turn notifications, urgent updates
- **WhatsApp**: Patient-friendly messaging
- **Push Notifications**: Real-time alerts

Notification triggers:
- Doctor delay alerts
- "Your turn in 10 minutes" warnings
- Lab report availability
- Appointment reminders
- Queue position updates

### 📱 Real-time Updates
- WebSocket integration for live queue updates
- Real-time appointment status changes
- Instant notification delivery

## Tech Stack

### Backend
- **Node.js** with Express.js
- **SQLite** database
- **Socket.io** for real-time communication
- **Nodemailer** for email notifications
- **Twilio** (configurable) for SMS/WhatsApp

### Frontend
- **React** with Vite
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Socket.io Client** for real-time updates
- **Axios** for API calls
- **Lucide React** for icons

## Installation

1. **Install dependencies:**
   ```bash
   npm run install-all
   ```

2. **Configure environment variables** (optional):
   Create a `.env` file in the root directory:
   ```env
   PORT=3001
   SMTP_HOST=smtp.gmail.com
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=noreply@hospital.com
   TWILIO_SID=your-twilio-sid
   TWILIO_AUTH_TOKEN=your-twilio-token
   TWILIO_PHONE_NUMBER=your-twilio-number
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:3001`
   - Frontend dev server on `http://localhost:5173`

## Project Structure

```
smart-hospital-appointment-system/
├── server/
│   ├── index.js                 # Main server file
│   ├── database.js              # Database initialization
│   ├── routes/
│   │   ├── appointments.js      # Appointment routes
│   │   ├── queue.js             # Queue management routes
│   │   ├── notifications.js    # Notification routes
│   │   ├── patients.js          # Patient routes
│   │   └── doctors.js           # Doctor routes
│   └── utils/
│       ├── priorityCalculator.js # Priority scoring logic
│       ├── timePredictor.js      # Consultation time prediction
│       └── notificationService.js # Notification service
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # Main dashboard
│   │   │   ├── Appointments.jsx # Appointment management
│   │   │   ├── Queue.jsx         # Queue view
│   │   │   ├── Patients.jsx     # Patient management
│   │   │   ├── Doctors.jsx      # Doctor listing
│   │   │   └── Notifications.jsx # Notification management
│   │   ├── App.jsx              # Main app component
│   │   └── main.jsx             # Entry point
│   └── package.json
└── package.json
```

## Usage

### Creating an Appointment
1. Navigate to **Appointments** page
2. Click **New Appointment**
3. Select patient, doctor, date/time, visit type, and priority level
4. The system automatically:
   - Calculates priority score
   - Predicts consultation duration
   - Adds patient to queue
   - Sends confirmation notification

### Managing Queue
1. Navigate to **Queue** page
2. Select a doctor to view their queue
3. Queue is automatically sorted by priority score
4. Click **Call Next Patient** to notify the next patient
5. Mark patients as served when consultation completes

### Sending Notifications
1. Navigate to **Notifications** page
2. Click **Send Notification**
3. Select patient, notification type, channels, and message
4. Notification is sent through selected channels

## API Endpoints

### Appointments
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `POST /api/appointments` - Create new appointment
- `PATCH /api/appointments/:id/status` - Update appointment status

### Queue
- `GET /api/queue/doctor/:doctorId` - Get queue for a doctor
- `GET /api/queue/patient/:patientId` - Get patient's queue status
- `POST /api/queue/call-next/:doctorId` - Call next patient
- `POST /api/queue/serve/:queueId` - Mark patient as served

### Notifications
- `GET /api/notifications/patient/:patientId` - Get patient notifications
- `POST /api/notifications/trigger` - Send notification manually

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create new patient

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID

## Database Schema

The system uses SQLite with the following tables:
- `doctors` - Doctor information
- `patients` - Patient records
- `appointments` - Appointment details
- `queue` - Queue management
- `notifications` - Notification history
- `consultation_history` - Historical data for predictions

## Future Enhancements

- [ ] User authentication and authorization
- [ ] Role-based access control (Admin, Doctor, Receptionist, Patient)
- [ ] Patient portal for self-service
- [ ] Mobile app integration
- [ ] Advanced analytics and reporting
- [ ] Integration with hospital management systems
- [ ] Multi-language support
- [ ] Calendar integration
- [ ] Automated appointment reminders
- [ ] Lab report integration

## License

MIT
