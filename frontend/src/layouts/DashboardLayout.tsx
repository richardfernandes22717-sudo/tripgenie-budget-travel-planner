import {
  FaBookmark,
  FaChartPie,
  FaClockRotateLeft,
  FaCommentDots,
  FaCompass,
  FaGear,
  FaHeart,
  FaHotel,
  FaMapLocationDot,
  FaRightFromBracket,
  FaUser,
} from 'react-icons/fa6';

import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Brand from '../components/Brand';
import s from '../components/ui.module.css';

const links = [
  ['/dashboard', FaChartPie, 'Overview'],
  ['/plan-trip', FaMapLocationDot, 'Plan Trip'],
  ['/explore', FaCompass, 'Explore'],
  ['/saved-trips', FaBookmark, 'Saved Trips'],
  ['/trip-history', FaClockRotateLeft, 'Trip History'],
  ['/favourites', FaHeart, 'Favourites'],
  ['/ai-assistant', FaCommentDots, 'AI Assistant'],
  ['/profile', FaUser, 'Profile'],
] as const;

export default function DashboardLayout() {
  const { user, logout } = useAuth();

  return (
    <div className={s.sidebarLayout}>
      <aside className={s.sidebar}>
        <Brand />

        <nav className={s.sideLinks}>
          {links.map(([to, Icon, label]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => (isActive ? s.active : '')}
            >
              <Icon />
              {label}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) => (isActive ? s.active : '')}
            >
              <FaHotel />
              Admin
            </NavLink>
          )}

          <button className="btn ghost" type="button" onClick={logout}>
            <FaRightFromBracket />
            Logout
          </button>
        </nav>
      </aside>

      <div className={s.main}>
        <header className={s.topbar}>
          <span className={s.mobileSide}>
            <Brand />
          </span>

          <span className="muted">AI Based  Budget Travel  Planner Workspace</span>

          <div className={s.profile}>
            <span className={s.avatar}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
            <span>{user?.name}</span>
          </div>
        </header>

        <main className={s.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}