import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import './styles.css'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { configured } from './lib/supabase'
import Login from './pages/Login'
import SetPassword from './pages/SetPassword'
import Layout from './components/Layout'
import Start from './pages/Start'
import Admin from './pages/Admin'
import Meetings from './pages/Meetings'
import MeetingDetail from './pages/MeetingDetail'
import RunMeeting from './pages/RunMeeting'
import Tasks from './pages/Tasks'
import Protocol from './pages/Protocol'
import Archive from './pages/Archive'
import ChangePassword from './pages/ChangePassword'

function Guard() {
  const { profile, loading, needsPassword } = useAuth()
  if (!configured) return <main><p className="error">Die App ist noch nicht mit Supabase verbunden (siehe README).</p></main>
  if (loading) return <main><p>Lädt …</p></main>
  if (!profile) return <Login />
  if (needsPassword) return <SetPassword />
  return (
    <Routes>
      <Route path="/sitzungen/:id/live" element={<RunMeeting />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Start />} />
        <Route path="/sitzungen" element={<Meetings />} />
        <Route path="/sitzungen/:id" element={<MeetingDetail />} />
        <Route path="/aufgaben" element={<Tasks />} />
        <Route path="/sitzungen/:id/protokoll" element={<Protocol />} />
        <Route path="/archiv" element={<Archive />} />
        <Route path="/passwort" element={<ChangePassword />} />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="*" element={<p>Seite nicht gefunden.</p>} />
      </Route>
    </Routes>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><HashRouter><AuthProvider><Guard /></AuthProvider></HashRouter></React.StrictMode>
)
