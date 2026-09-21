import { AuthProvider, useAuth } from './store/authStore'
import { AlumnosProvider } from './store/alumnosStore'
import { ToastProvider } from './components/Toast'
import { Dashboard } from './components/Dashboard'
import { LoginPage } from './components/LoginPage'

function Gate() {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-brand-soft text-ink-muted">
        Cargando sesión…
      </div>
    )
  }
  if (!session) return <LoginPage />
  return (
    <AlumnosProvider>
      <ToastProvider>
        <Dashboard />
      </ToastProvider>
    </AlumnosProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}

export default App
