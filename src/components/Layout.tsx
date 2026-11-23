import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function Layout() {
  const { profile, isAdmin, signOut } = useAuth()
  const link = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '')
  return (
    <>
      <header className="top">
        <img src="./wappen.jpg" alt="" height={40} />
        <strong>ASV Steinach – Sitzungen</strong>
        <span className="spacer" />
        <span className="muted who">{profile?.name}{isAdmin ? ' (Admin)' : ''}</span>
        <Link className="btn small" to="/passwort">Passwort ändern</Link>
        <button onClick={signOut}>Abmelden</button>
      </header>
      <nav className="nav">
        <NavLink to="/" end className={link}>Start</NavLink>
        <NavLink to="/sitzungen" className={link}>Sitzungen</NavLink>
        <NavLink to="/aufgaben" className={link}>Aufgaben</NavLink>
        <NavLink to="/archiv" className={link}>Archiv</NavLink>
        {isAdmin && <NavLink to="/admin" className={link}>Admin</NavLink>}
      </nav>
      <main><Outlet /></main>
    </>
  )
}
