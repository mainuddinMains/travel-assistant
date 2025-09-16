
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Login } from '../pages/Login'
import { Signup } from '../pages/Signup'
import { Home } from '../pages/Home'
import { LanguageGate } from '../pages/LanguageGate'
import { useAuth } from './providers/AuthProvider'

function Protected({ children }: { children: JSX.Element }) {
  const { token } = useAuth()
  console.log('Protected route - token:', token)
  if (!token) {
    console.log('No token found, redirecting to login')
    return <Navigate to="/login" replace />
  }
  console.log('Token found, allowing access to protected route')
  return children
}

export const router = createBrowserRouter([
  { path: '/', element: <LanguageGate /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/home', element: <Protected><Home /></Protected> },
  { path: '*', element: <Navigate to="/" replace /> }
])
