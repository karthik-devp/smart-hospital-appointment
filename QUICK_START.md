# Quick Start Guide

## Step-by-Step Instructions to Run the Application

### Step 1: Install Dependencies

Open your terminal in the project root directory and run:

```bash
npm run install-all
```

This will install all dependencies for both the backend server and frontend client.

**Note:** If you encounter any errors, you can install them separately:
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### Step 2: Start the Application

Run both the backend server and frontend client simultaneously:

```bash
npm run dev
```

This command will:
- Start the backend server on `http://localhost:3001`
- Start the frontend development server on `http://localhost:5173`

### Step 3: Access the Application

1. Open your web browser
2. Navigate to: **http://localhost:5173**
3. You should see the Smart Hospital Appointment System dashboard

### Step 4: Verify Everything is Working

- ✅ Backend server should show: "Server running on port 3001"
- ✅ Backend should show: "Connected to SQLite database"
- ✅ Frontend should open in your browser
- ✅ You should see sample doctors and patients in the system

## Troubleshooting

### Port Already in Use

If port 3001 or 5173 is already in use:

1. **Change backend port:** Create a `.env` file in the root directory:
   ```
   PORT=3002
   ```

2. **Change frontend port:** Edit `client/vite.config.js` and change the port number

### Database Issues

The database (`hospital.db`) will be created automatically on first run. If you need to reset it:
- Delete `server/hospital.db` file
- Restart the server

### Dependencies Not Installing

If you're on Windows and having issues:
```bash
# Try using npm with admin privileges or use:
npm install --legacy-peer-deps
```

## Running Separately (Optional)

If you prefer to run backend and frontend separately:

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

## What to Do Next

1. **Explore the Dashboard** - See statistics and recent appointments
2. **Create a Patient** - Go to Patients page and add a new patient
3. **Schedule an Appointment** - Create appointments and see them in the queue
4. **Manage Queue** - View and manage patient queues for each doctor
5. **Send Notifications** - Test the notification system

## Default Sample Data

The system comes with:
- **4 Doctors:** Dr. Sarah Johnson (Cardiology), Dr. Michael Chen (Pediatrics), Dr. Emily Rodriguez (General Medicine), Dr. James Wilson (Orthopedics)
- **3 Patients:** John Doe, Jane Smith (Senior Citizen), Robert Brown (VIP)

You can start using these immediately or create your own!
