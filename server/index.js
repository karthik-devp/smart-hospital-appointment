require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const { initDatabase } = require('./database');
const appointmentRoutes = require('./routes/appointments');
const queueRoutes = require('./routes/queue');
const notificationRoutes = require('./routes/notifications');
const patientRoutes = require('./routes/patients');
const doctorRoutes = require('./routes/doctors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Initialize database and start server
initDatabase()
  .then(() => {
    // Routes
    app.use('/api/appointments', appointmentRoutes(io));
    app.use('/api/queue', queueRoutes(io));
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/patients', patientRoutes);
    app.use('/api/doctors', doctorRoutes);

    // Socket.io connection handling
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
