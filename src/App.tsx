import { Dashboard } from './components/Dashboard'
import { ToastProvider } from './components/Toast'
import { AlumnosProvider } from './store/alumnosStore'

function App() {
  return (
    <AlumnosProvider>
      <ToastProvider>
        <Dashboard />
      </ToastProvider>
    </AlumnosProvider>
  )
}

export default App
