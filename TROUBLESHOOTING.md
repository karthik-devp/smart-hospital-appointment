# Troubleshooting Guide

## Common Issues and Solutions

### 1. Nodemon App Crashed Error

**Symptoms:** `[nodemon] app crashed - waiting for file changes before starting...`

**Possible Causes & Solutions:**

#### a) Database Initialization Issue
- **Solution:** The database initialization has been fixed. Make sure you're using the latest code.
- Delete `server/hospital.db` if it exists and restart the server

#### b) Missing Dependencies
- **Solution:** Run `npm run install-all` again
- Check if `node_modules` folder exists in both root and `client` directory

#### c) Port Already in Use
- **Solution:** 
  - Check if port 3001 is already in use: `netstat -ano | findstr :3001` (Windows)
  - Kill the process or change the port in `.env` file

#### d) SQLite3 Installation Issue (Windows)
- **Solution:** 
  ```bash
  npm install --build-from-source sqlite3
  ```
  Or use prebuilt binaries:
  ```bash
  npm install sqlite3 --target_platform=win32 --target_arch=x64
  ```

### 2. Module Not Found Errors

**Error:** `Cannot find module 'xyz'`

**Solution:**
```bash
# Install missing dependencies
npm install
cd client && npm install
```

### 3. Database Connection Errors

**Error:** `Error opening database` or `Database not initialized`

**Solution:**
- Make sure you have write permissions in the `server` directory
- Delete `server/hospital.db` and restart
- Check if SQLite3 is properly installed: `npm list sqlite3`

### 4. Frontend Not Loading

**Error:** Cannot access `http://localhost:5173`

**Solution:**
- Make sure the frontend server is running: `cd client && npm run dev`
- Check if port 5173 is available
- Clear browser cache and try again

### 5. CORS Errors

**Error:** `Access-Control-Allow-Origin` errors

**Solution:**
- Make sure backend is running on port 3001
- Check `server/index.js` CORS configuration
- Verify frontend is accessing `http://localhost:5173`

### 6. Email Notifications Not Working

**Error:** Email sending fails

**Solution:**
- Email notifications will work without SMTP credentials (they'll just log to console)
- To enable actual email sending, create `.env` file with:
  ```
  SMTP_HOST=smtp.gmail.com
  SMTP_USER=your-email@gmail.com
  SMTP_PASS=your-app-password
  SMTP_FROM=noreply@hospital.com
  ```

### 7. Socket.io Connection Issues

**Error:** WebSocket connection fails

**Solution:**
- Make sure both backend and frontend are running
- Check firewall settings
- Verify Socket.io CORS configuration in `server/index.js`

## Debugging Steps

1. **Check Server Logs:**
   - Look for error messages in the terminal where you ran `npm run dev`
   - Check for database connection messages

2. **Verify Installation:**
   ```bash
   # Check Node.js version (should be 14+)
   node --version
   
   # Check npm version
   npm --version
   
   # Verify dependencies
   npm list --depth=0
   ```

3. **Test Database:**
   - Check if `server/hospital.db` file is created
   - Try opening it with a SQLite browser

4. **Check Ports:**
   ```bash
   # Windows
   netstat -ano | findstr :3001
   netstat -ano | findstr :5173
   
   # Kill process if needed (replace PID)
   taskkill /PID <PID> /F
   ```

## Getting Help

If you're still experiencing issues:

1. Check the terminal output for specific error messages
2. Verify all dependencies are installed
3. Make sure you're in the correct directory
4. Try deleting `node_modules` and reinstalling:
   ```bash
   rm -rf node_modules client/node_modules
   npm run install-all
   ```

## Fresh Start

If nothing works, try a complete fresh start:

```bash
# Delete all generated files
rm -rf node_modules client/node_modules server/hospital.db

# Reinstall everything
npm run install-all

# Start fresh
npm run dev
```
