import { useState, useEffect } from 'react'
import axios from 'axios'
import { Clock, User, PhoneCall, CheckCircle } from 'lucide-react'

export default function Queue({ socket }) {
  const [queues, setQueues] = useState({})
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)

  useEffect(() => {
    fetchDoctors()
    
    socket.on('queue_updated', () => {
      if (selectedDoctor) {
        fetchQueue(selectedDoctor)
      }
    })

    return () => {
      socket.off('queue_updated')
    }
  }, [socket, selectedDoctor])

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/api/doctors')
      setDoctors(response.data)
      if (response.data.length > 0 && !selectedDoctor) {
        setSelectedDoctor(response.data[0].id)
        fetchQueue(response.data[0].id)
      }
    } catch (error) {
      console.error('Error fetching doctors:', error)
    }
  }

  const fetchQueue = async (doctorId) => {
    try {
      const response = await axios.get(`/api/queue/doctor/${doctorId}`)
      setQueues(prev => ({ ...prev, [doctorId]: response.data }))
    } catch (error) {
      console.error('Error fetching queue:', error)
    }
  }

  const callNext = async (doctorId) => {
    try {
      await axios.post(`/api/queue/call-next/${doctorId}`)
      fetchQueue(doctorId)
    } catch (error) {
      console.error('Error calling next patient:', error)
      alert(error.response?.data?.error || 'Failed to call next patient')
    }
  }

  const markServed = async (queueId, doctorId) => {
    try {
      const duration = prompt('Enter consultation duration in minutes:')
      if (duration) {
        await axios.post(`/api/queue/serve/${queueId}`, { actual_duration: parseInt(duration) })
        fetchQueue(doctorId)
      }
    } catch (error) {
      console.error('Error marking as served:', error)
    }
  }

  const currentQueue = selectedDoctor ? queues[selectedDoctor] || [] : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Patient Queue</h1>
        <p className="mt-2 text-sm text-gray-600">Manage patient queue and consultations</p>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Doctor</label>
        <select
          value={selectedDoctor || ''}
          onChange={(e) => {
            const doctorId = parseInt(e.target.value)
            setSelectedDoctor(doctorId)
            fetchQueue(doctorId)
          }}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        >
          {doctors.map(doctor => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.name} - {doctor.specialization}
            </option>
          ))}
        </select>
      </div>

      {selectedDoctor && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Queue for {doctors.find(d => d.id === selectedDoctor)?.name}
              </h3>
              <button
                onClick={() => callNext(selectedDoctor)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <PhoneCall className="h-4 w-4 mr-2" />
                Call Next Patient
              </button>
            </div>

            {currentQueue.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No patients in queue</p>
            ) : (
              <div className="space-y-3">
                {currentQueue.map((item, index) => (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-4 ${
                      index === 0 ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                            index === 0 ? 'bg-green-500' : 'bg-gray-400'
                          }`}>
                            {item.position}
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{item.patient_name}</h4>
                            <p className="text-sm text-gray-500">{item.patient_phone}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                item.priority_level === 'EMERGENCY' ? 'bg-red-100 text-red-800' :
                                item.priority_level === 'VIP' ? 'bg-purple-100 text-purple-800' :
                                item.priority_level === 'FOLLOW_UP' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {item.priority_level}
                              </span>
                              <span className="text-sm text-gray-600">{item.visit_type}</span>
                              {item.is_senior_citizen && (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                  Senior
                                </span>
                              )}
                              {item.is_vip && (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                  VIP
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <Clock className="h-4 w-4 mr-1" />
                          Wait: ~{item.estimated_wait_time || 0} min
                        </div>
                        {index === 0 && (
                          <button
                            onClick={() => markServed(item.id, selectedDoctor)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Served
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
