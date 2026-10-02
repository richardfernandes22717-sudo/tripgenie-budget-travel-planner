import { useState } from 'react';
import {
  FaArrowLeft,
  FaBars,
  FaBed,
  FaBrain,
  FaBus,
  FaChartLine,
  FaLandmark,
  FaMapLocationDot,
  FaRightFromBracket,
  FaRoute,
  FaShieldHalved,
  FaStar,
  FaStore,
  FaTicket,
  FaUsers,
  FaXmark,
} from 'react-icons/fa6';
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import Brand from '../components/Brand';
import { useAuth } from '../context/AuthContext';
import s from '../components/ui.module.css';

const links = [
  {
    to: '/admin',
    icon: FaChartLine,
    label: 'Dashboard',
    end: true,
  },
  {
    to: '/admin/users',
    icon: FaUsers,
    label: 'Users',
  },
  {
    to: '/admin/destinations',
    icon: FaMapLocationDot,
    label: 'Destinations',
  },
  {
    to: '/admin/hotels',
    icon: FaBed,
    label: 'Hotels',
  },
  {
    to: '/admin/restaurants',
    icon: FaStore,
    label: 'Restaurants',
  },
  {
    to: '/admin/attractions',
    icon: FaLandmark,
    label: 'Attractions',
  },
  {
    to: '/admin/transportation',
    icon: FaBus,
    label: 'Transportation',
  },
  {
    to: '/admin/travel_packages',
    icon: FaRoute,
    label: 'Packages',
  },
  {
    to: '/admin/bookings',
    icon: FaTicket,
    label: 'Bookings',
  },
  {
    to: '/admin/reviews',
    icon: FaStar,
    label: 'Reviews',
  },
  {
    to: '/admin/trips',
    icon: FaRoute,
    label: 'Trip monitoring',
  },
  {
    to: '/admin/ai-statistics',
    icon: FaBrain,
    label: 'AI statistics',
  },
] as const;

const getCurrentSection = (pathname: string) => {
  const exactMatch = links.find((link) => link.to === pathname);

  if (exactMatch) {
    return exactMatch.label;
  }

  const nestedMatch = [...links]
    .reverse()
    .find(
      (link) =>
        link.to !== '/admin' &&
        pathname.startsWith(link.to),
    );

  return nestedMatch?.label || 'Administration';
};

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const initials = (user?.name || 'Admin')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const handleLogout = () => {
    logout();

    navigate('/login', {
      replace: true,
    });
  };

  return (
    <div className={s.adminShell}>
      {mobileMenuOpen && (
        <button
          type="button"
          className={s.adminMobileOverlay}
          aria-label="Close admin navigation"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`${s.adminSidebar} ${
          mobileMenuOpen ? s.adminSidebarOpen : ''
        }`}
      >
        <header className={s.adminSidebarHeader}>
          <Link
            to="/admin"
            className={s.adminBrandLink}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Brand />
          </Link>

          <button
            type="button"
            className={s.adminSidebarClose}
            aria-label="Close navigation"
            onClick={() => setMobileMenuOpen(false)}
          >
            <FaXmark />
          </button>
        </header>

        <div className={s.adminWorkspaceBadge}>
          <span>
            <FaShieldHalved />
          </span>

          <div>
            <strong>Admin workspace</strong>
            <small>Protected management area</small>
          </div>
        </div>

        <nav
          className={s.adminNavigation}
          aria-label="Admin navigation"
        >
          <span className={s.adminNavigationTitle}>
            Management
          </span>

          {links.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/admin'}
                className={({ isActive }) =>
                  `${s.adminNavigationLink} ${
                    isActive
                      ? s.adminNavigationLinkActive
                      : ''
                  }`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>
                  <Icon />
                </span>

                <strong>{link.label}</strong>
              </NavLink>
            );
          })}
        </nav>

        <footer className={s.adminSidebarFooter}>
          <Link
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
          >
            <FaArrowLeft />
            Return to user app
          </Link>

          <button type="button" onClick={handleLogout}>
            <FaRightFromBracket />
            Sign out
          </button>
        </footer>
      </aside>

      <div className={s.adminMain}>
        <header className={s.adminTopbar}>
          <div className={s.adminTopbarLeft}>
            <button
              type="button"
              className={s.adminMenuButton}
              aria-label="Open admin navigation"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(true)}
            >
              <FaBars />
            </button>

            <div>
              <small>TripGenie administration</small>
              <strong>
                {getCurrentSection(location.pathname)}
              </strong>
            </div>
          </div>

          <div className={s.adminTopbarRight}>
            <div className={s.adminProtectionStatus}>
              <span />
              Protected
            </div>

            <div className={s.adminProfile}>
              <div>
                <strong>{user?.name || 'Administrator'}</strong>

                <span>
                  <FaShieldHalved />
                  Administrator
                </span>
              </div>

              <span className={s.adminProfileAvatar}>
                {initials || 'A'}
              </span>
            </div>
          </div>
        </header>

        <main className={s.adminContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}