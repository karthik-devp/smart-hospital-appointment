import { useState, useEffect } from 'react'
import axios from 'axios'
import { Calendar, Users, Clock, Activity } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    activeQueue: 0,
    totalPatients: 0
  })
  const [recentAppointments, setRecentAppointments] = useState([])

  useEffect(() => {
    fetchStats()
    fetchRecentAppointments()
  }, [])

  const fetchStats = async () => {
    try {
      const [appointments, queue, patients] = await Promise.all([
        axios.get('/api/appointments'),
        axios.get('/api/queue/doctor/1'),
        axios.get('/api/patients')
      ])

      const today = new Date().toISOString().split('T')[0]
      const todayAppts = appointments.data.filter(apt => 
        apt.appointment_date?.startsWith(today)
      )

      setStats({
        totalAppointments: appointments.data.length,
        todayAppointments: todayAppts.length,
        activeQueue: queue.data.length,
        totalPatients: patients.data.length
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchRecentAppointments = async () => {
    try {
      const response = await axios.get('/api/appointments?status=scheduled')
      setRecentAppointments(response.data.slice(0, 5))
    } catch (error) {
      console.error('Error fetching appointments:', error)
    }
  }

  const statCards = [
    {
      title: 'Total Appointments',
      value: stats.totalAppointments,
      icon: Calendar,
      color: 'bg-blue-500'
    },
    {
      title: 'Today\'s Appointments',
      value: stats.todayAppointments,
      icon: Activity,
      color: 'bg-green-500'
    },
    {
      title: 'Active Queue',
      value: stats.activeQueue,
      icon: Clock,
      color: 'bg-yellow-500'
    },
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      icon: Users,
      color: 'bg-purple-500'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">Overview of hospital operations</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.title}</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stat.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Appointments</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{appointment.patient_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appointment.doctor_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(appointment.appointment_date).toLocaleString()}
                    </td>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
