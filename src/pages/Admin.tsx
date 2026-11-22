import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import AdminMembers from './AdminMembers'
import AdminTemplate from './AdminTemplate'
import AdminExport from './AdminExport'

export default function Admin() {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/" replace />
  const link = ({ isActive }: { isActive: boolean }) => 'btn' + (isActive ? ' primary' : '')
  return (
    <>
      <h1>Admin</h1>
      <div className="row">
        <NavLink to="/admin" end className={link}>Mitglieder</NavLink>
        <NavLink to="/admin/vorlage" className={link}>Tagesordnungs-Vorlage</NavLink>
        <NavLink to="/admin/export" className={link}>Datensicherung</NavLink>
      </div>
      <Routes>
        <Route index element={<AdminMembers />} />
        <Route path="vorlage" element={<AdminTemplate />} />
        <Route path="export" element={<AdminExport />} />
      </Routes>
    </>
  )
}
