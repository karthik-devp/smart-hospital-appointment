import { useState, useEffect } from 'react'
import axios from 'axios'
import { Stethoscope, Clock } from 'lucide-react'

export default function Doctors() {
  const [doctors, setDoctors] = useState([])

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/api/doctors')
      setDoctors(response.data)
    } catch (error) {
      console.error('Error fetching doctors:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Doctors</h1>
        <p className="mt-2 text-sm text-gray-600">View all doctors and their specializations</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {doctors.map((doctor) => (
          <div key={doctor.id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <Stethoscope className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Doctor</dt>
                    <dd className="text-lg font-semibold text-gray-900">{doctor.name}</dd>
                    <dt className="text-sm font-medium text-gray-500 truncate mt-2">Specialization</dt>
                    <dd className="text-sm text-gray-900">{doctor.specialization}</dd>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      Avg: {doctor.consultation_time_avg} min
                    </div>
                  </dl>
                </div>
              </div>
              {doctor.email && (
                <div className="mt-4 text-sm text-gray-500">
                  <p>{doctor.email}</p>
                  {doctor.phone && <p>{doctor.phone}</p>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
