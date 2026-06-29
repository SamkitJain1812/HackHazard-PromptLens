import { useEffect, useState } from 'react'
import LandingPage   from './pages/LandingPage'
import UploadPage    from './pages/UploadPage'
import DashboardPage from './pages/DashboardPage'
import { SESSION_STORAGE_KEY, closeSession } from './services/api'

export default function App() {
  const [page, setPage]                 = useState('landing')
  const [initialQuery, setInitialQuery] = useState('')
  const [sessionId, setSessionId]       = useState(null)

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (stored) setSessionId(stored)
  }, [])

  const goHome = () => {
    setPage('landing')
    setInitialQuery('')
    if (sessionId) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
      closeSession(sessionId)
    }
    setSessionId(null)
  }

  const handleGetAccess = (query) => {
    setInitialQuery(query || '')
    setPage('upload')
  }

  const handleStartQuerying = (sid) => {
    if (sid) sessionStorage.setItem(SESSION_STORAGE_KEY, sid)
    else sessionStorage.removeItem(SESSION_STORAGE_KEY)
    setSessionId(sid)
    setPage('dashboard')
  }

  if (page === 'landing')   return <LandingPage   onGetAccess={handleGetAccess} />
  if (page === 'upload')    return <UploadPage     onStartQuerying={handleStartQuerying} sessionId={sessionId} />
  return                           <DashboardPage  initialQuery={initialQuery} sessionId={sessionId} onGoHome={goHome} />
}
