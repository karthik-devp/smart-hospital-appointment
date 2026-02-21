import { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Calendar, Clock } from 'lucide-react'

export default function Appointments({ socket }) {
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    visit_type: 'consultation',
    priority_level: 'ROUTINE',
    notes: ''
  })

  useEffect(() => {
    fetchAppointments()
    fetchPatients()
    fetchDoctors()

    socket.on('appointment_created', () => {
      fetchAppointments()
    })

    socket.on('appointment_updated', () => {
      fetchAppointments()
    })

    return () => {
      socket.off('appointment_created')
      socket.off('appointment_updated')
    }
  }, [socket])

  const fetchAppointments = async () => {
    try {
      const response = await axios.get('/api/appointments')
      setAppointments(response.data)
    } catch (error) {
      console.error('Error fetching appointments:', error)
    }
  }

  const fetchPatients = async () => {
    try {
      const response = await axios.get('/api/patients')
      setPatients(response.data)
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
  }

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/api/doctors')
      setDoctors(response.data)
    } catch (error) {
      console.error('Error fetching doctors:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/appointments', formData)
      setShowModal(false)
      setFormData({
        patient_id: '',
        doctor_id: '',
        appointment_date: '',
        visit_type: 'consultation',
        priority_level: 'ROUTINE',
        notes: ''
      })
      fetchAppointments()
    } catch (error) {
      console.error('Error creating appointment:', error)
      alert('Failed to create appointment')
    }
  }

  const updateStatus = async (id, status, actualDuration) => {
    try {
      await axios.patch(`/api/appointments/${id}/status`, { status, actual_duration: actualDuration })
      fetchAppointments()
    } catch (error) {
      console.error('Error updating appointment:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="mt-2 text-sm text-gray-600">Manage patient appointments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Appointment
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visit Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{appointment.patient_name}</div>
                  <div className="text-sm text-gray-500">{appointment.patient_phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{appointment.doctor_name}</div>
                  <div className="text-sm text-gray-500">{appointment.specialization}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(appointment.appointment_date).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appointment.visit_type}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    appointment.priority_level === 'EMERGENCY' ? 'bg-red-100 text-red-800' :
                    appointment.priority_level === 'VIP' ? 'bg-purple-100 text-purple-800' :
                    appointment.priority_level === 'FOLLOW_UP' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {appointment.priority_level}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {appointment.estimated_duration || 15} min
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {appointment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {appointment.status === 'scheduled' && (
                    <button
                      onClick={() => {
                        const duration = prompt('Enter actual duration in minutes:')
                        if (duration) {
                          updateStatus(appointment.id, 'completed', parseInt(duration))
                        }
                      }}
                      className="text-green-600 hover:text-green-900"
                    >
                      Complete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit} className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Create New Appointment</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Patient</label>
                    <select
                      required
                      value={formData.patient_id}
                      onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="">Select Patient</option>
                      {patients.map(patient => (
                        <option key={patient.id} value={patient.id}>{patient.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Doctor</label>
                    <select
                      required
                      value={formData.doctor_id}
                      onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="">Select Doctor</option>
                      {doctors.map(doctor => (
                        <option key={doctor.id} value={doctor.id}>{doctor.name} - {doctor.specialization}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.appointment_date}
                      onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Visit Type</label>
                    <select
                      value={formData.visit_type}
                      onChange={(e) => setFormData({ ...formData, visit_type: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="consultation">Consultation</option>
                      <option value="follow-up">Follow-up</option>
                      <option value="checkup">Checkup</option>
                      <option value="emergency">Emergency</option>
                      <option value="procedure">Procedure</option>
                      <option value="review">Review</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority Level</label>
                    <select
                      value={formData.priority_level}
                      onChange={(e) => setFormData({ ...formData, priority_level: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="ROUTINE">Routine</option>
                      <option value="FOLLOW_UP">Follow-up</option>
                      <option value="EMERGENCY">Emergency</option>
                      <option value="VIP">VIP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows="3"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 sm:col-start-2 sm:text-sm"
                  >
                    Create Appointment
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
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
