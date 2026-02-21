# Starting the Frontend

## Option 1: If you ran `npm run dev` (Recommended)
The frontend should start automatically! Check your terminal - you should see:
```
> client@1.0.0 dev
> vite

  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

If you see this, **skip to Step 3** below!

## Option 2: Start Frontend Separately
If the frontend didn't start automatically, open a **NEW terminal window** and run:

```bash
cd client
npm run dev
```

## Step 3: Open in Browser
Once the frontend is running, open your web browser and go to:

**http://localhost:5173**

You should see the Smart Hospital Appointment System dashboard!

## What You'll See
- **Dashboard** - Overview with statistics
- **Appointments** - Schedule and manage appointments
- **Queue** - View and manage patient queues
- **Patients** - Add and manage patients
- **Doctors** - View all doctors
- **Notifications** - Send and view notifications

## Quick Test
1. Go to **Patients** page - you should see 3 sample patients
2. Go to **Doctors** page - you should see 4 sample doctors
3. Go to **Appointments** page - click "New Appointment" to create one
4. Go to **Queue** page - select a doctor to see their queue

## Troubleshooting
- If you see "Cannot GET /" - make sure you're accessing `http://localhost:5173` (not 3001)
- If frontend won't start - make sure you ran `npm install` in the `client` folder
- If you see connection errors - make sure backend is still running on port 3001
