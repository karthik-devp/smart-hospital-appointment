import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import Dashboard from './pages/Dashboard'
import Appointments from './pages/Appointments'
import Queue from './pages/Queue'
import Patients from './pages/Patients'
import Doctors from './pages/Doctors'
import Notifications from './pages/Notifications'
import { Bell, Calendar, Users, Stethoscope, LayoutDashboard, List } from 'lucide-react'

const socket = io('http://localhost:3001')

function App() {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    socket.on('appointment_created', (data) => {
      console.log('Appointment created:', data)
    })

    socket.on('appointment_updated', (data) => {
      console.log('Appointment updated:', data)
    })

    socket.on('queue_updated', (data) => {
      console.log('Queue updated:', data)
      setNotifications(prev => [...prev, {
        id: Date.now(),
        message: 'Queue has been updated',
        type: 'queue_update',
        timestamp: new Date()
      }])
    })

    return () => {
      socket.off('appointment_created')
      socket.off('appointment_updated')
      socket.off('queue_updated')
    }
  }, [])

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Stethoscope className="h-8 w-8 text-primary-600" />
                  <span className="ml-2 text-xl font-bold text-gray-900">Smart Hospital</span>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link to="/" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-primary-600">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                  <Link to="/appointments" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-primary-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Appointments
                  </Link>
                  <Link to="/queue" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-primary-600">
                    <List className="h-4 w-4 mr-2" />
                    Queue
                  </Link>
                  <Link to="/patients" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-primary-600">
                    <Users className="h-4 w-4 mr-2" />
                    Patients
                  </Link>
                  <Link to="/doctors" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-primary-600">
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Doctors
                  </Link>
                  <Link to="/notifications" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-primary-600 relative">
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                    {notifications.length > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {notifications.length}
                      </span>
                    )}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/appointments" element={<Appointments socket={socket} />} />
            <Route path="/queue" element={<Queue socket={socket} />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/notifications" element={<Notifications />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
