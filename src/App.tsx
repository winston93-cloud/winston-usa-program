import { Dashboard } from './components/Dashboard'
import { AlumnosProvider } from './store/alumnosStore'

function App() {
  return (
    <AlumnosProvider>
      <Dashboard />
    </AlumnosProvider>
  )
}

export default App
