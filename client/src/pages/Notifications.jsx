import { useState, useEffect } from 'react'
import axios from 'axios'
import { Bell, Mail, MessageSquare, Smartphone } from 'lucide-react'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [patients, setPatients] = useState([])
  const [showTriggerModal, setShowTriggerModal] = useState(false)
  const [triggerData, setTriggerData] = useState({
    patient_id: '',
    appointment_id: '',
    type: 'turn_soon',
    message: '',
    channels: ['email']
  })

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const response = await axios.get('/api/patients')
      setPatients(response.data)
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
  }

  const fetchNotifications = async (patientId) => {
    try {
      const response = await axios.get(`/api/notifications/patient/${patientId}`)
      setNotifications(response.data)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const handleTrigger = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/notifications/trigger', triggerData)
      alert('Notification sent successfully!')
      setShowTriggerModal(false)
      if (triggerData.patient_id) {
        fetchNotifications(triggerData.patient_id)
      }
    } catch (error) {
      console.error('Error triggering notification:', error)
      alert('Failed to send notification')
    }
  }

  const getChannelIcon = (channel) => {
    switch (channel.toLowerCase()) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <MessageSquare className="h-4 w-4" />
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />
      case 'push':
        return <Smartphone className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-2 text-sm text-gray-600">Manage and send patient notifications</p>
        </div>
        <button
          onClick={() => setShowTriggerModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Bell className="h-5 w-5 mr-2" />
          Send Notification
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">View Notifications for Patient</label>
        <select
          onChange={(e) => {
            const patientId = e.target.value
            setTriggerData({ ...triggerData, patient_id: patientId })
            if (patientId) {
              fetchNotifications(patientId)
            } else {
              setNotifications([])
            }
          }}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="">Select Patient</option>
          {patients.map(patient => (
            <option key={patient.id} value={patient.id}>{patient.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Notification History</h3>
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No notifications found. Select a patient to view their notifications.</p>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getChannelIcon(notification.channel)}
                        <span className="text-sm font-medium text-gray-900">{notification.type}</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          notification.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {notification.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Channel: {notification.channel} | 
                        {notification.sent_at 
                          ? ` Sent: ${new Date(notification.sent_at).toLocaleString()}`
                          : ` Created: ${new Date(notification.created_at).toLocaleString()}`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showTriggerModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowTriggerModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleTrigger} className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Send Notification</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Patient</label>
                    <select
                      required
                      value={triggerData.patient_id}
                      onChange={(e) => setTriggerData({ ...triggerData, patient_id: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="">Select Patient</option>
                      {patients.map(patient => (
                        <option key={patient.id} value={patient.id}>{patient.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notification Type</label>
                    <select
                      value={triggerData.type}
                      onChange={(e) => setTriggerData({ ...triggerData, type: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="doctor_delay">Doctor Delay</option>
                      <option value="turn_soon">Turn Coming Soon (10 min)</option>
                      <option value="lab_report">Lab Report Ready</option>
                      <option value="appointment_reminder">Appointment Reminder</option>
                      <option value="queue_update">Queue Update</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Message</label>
                    <textarea
                      value={triggerData.message}
                      onChange={(e) => setTriggerData({ ...triggerData, message: e.target.value })}
                      rows="3"
                      placeholder="Leave empty to use default message"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Channels</label>
                    <div className="space-y-2">
                      {['email', 'sms', 'whatsapp', 'push'].map(channel => (
                        <label key={channel} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={triggerData.channels.includes(channel)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTriggerData({ ...triggerData, channels: [...triggerData.channels, channel] })
                              } else {
                                setTriggerData({ ...triggerData, channels: triggerData.channels.filter(c => c !== channel) })
                              }
                            }}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 block text-sm text-gray-900 capitalize">{channel}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 sm:col-start-2 sm:text-sm"
                  >
                    Send Notification
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTriggerModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:col-start-1 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
