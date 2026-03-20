import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Home     from './pages/Home'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/"           element={<Home />} />
        <Route path="/admin"      element={<AdminLogin />} />
        <Route path="/admin/dash" element={
          <ProtectedRoute><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  )
}
