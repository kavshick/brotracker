import { Routes, Route, Navigate } from 'react-router-dom'
import Home     from './pages/Home'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/schedule" element={<AdminDashboard />} />
      <Route path="/admin" element={<Navigate to="/schedule" replace />} />
      <Route path="/admin/dash" element={<Navigate to="/schedule" replace />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
