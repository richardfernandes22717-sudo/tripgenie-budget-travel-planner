import { useEffect, useState } from 'react';
import {
  FaArrowRight,
  FaBars,
  FaCircleCheck,
  FaLocationDot,
  FaPlaneDeparture,
  FaRobot,
  FaShieldHalved,
  FaWallet,
  FaXmark,
} from 'react-icons/fa6';
import { Link, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import Brand from '../components/Brand';
import s from '../components/ui.module.css';

export default function PublicLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const dashboardPath = user?.role === 'admin' ? '/admin' : '/dashboard';

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <div className={s.publicApp}>
      <div className={s.announcement}>
      </div>

      <header className={s.nav}>
        <div className={`container ${s.navInner}`}>
          <Link
            to="/"
            className={s.brandLink}
            aria-label="TripGenie home"
          >
            <Brand />
          </Link>

          <nav className={s.links} aria-label="Main navigation">
            <Link
              to="/"
              className={location.pathname === '/' ? s.navActive : ''}
            >
              Home
            </Link>

            <Link
              to="/explore"
              className={location.pathname.startsWith('/explore') ? s.navActive : ''}
            >
              Explore
            </Link>

            <Link
              to="/about"
              className={location.pathname === '/about' ? s.navActive : ''}
            >
              About
            </Link>
          </nav>

          <div className={s.navActions}>
            {user ? (
              <Link className="btn" to={dashboardPath}>
                Open dashboard
                <FaArrowRight />
              </Link>
            ) : (
              <>
                <Link className={s.loginLink} to="/login">
                  Login
                </Link>

                <Link className="btn" to="/register">
                  Start planning
                  <FaArrowRight />
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className={s.mobileToggle}
            onClick={() => setOpen((current) => !current)}
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={open}
          >
            {open ? <FaXmark /> : <FaBars />}
          </button>
        </div>

        {open && (
          <div className={s.mobileMenu}>
            <div className="container">
              <nav className={s.mobileLinks} aria-label="Mobile navigation">
                <Link to="/">Home</Link>
                <Link to="/explore">Explore destinations</Link>
                <Link to="/about">About TripGenie</Link>

                <div className={s.mobileDivider} />

                {user ? (
                  <Link className="btn" to={dashboardPath}>
                    Open dashboard
                    <FaArrowRight />
                  </Link>
                ) : (
                  <>
                    <Link to="/login">Login to your account</Link>

                    <Link className="btn" to="/register">
                      Create free account
                      <FaArrowRight />
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </div>
        )}
      </header>

      <main className={s.publicMain}>
        <Outlet />
      </main>

      <section className={s.preFooter}>
        <div className={`container ${s.preFooterGrid}`}>
          <div>
            <span className={s.eyebrow}>Plan smarter</span>

            <h2>Your entire trip, organized around your budget.</h2>

            <p>
              TripGenie combines verified destination data with artificial
              intelligence to create practical itineraries, realistic cost
              estimates and personalized recommendations.
            </p>
          </div>

          <div className={s.preFooterFeatures}>
            <div>
              <span className={s.featureIcon}>
                <FaWallet />
              </span>

              <div>
                <strong>Budget-first planning</strong>
                <p>
                  Hotels, meals, attractions and transport are selected according
                  to your available budget.
                </p>
              </div>
            </div>

            <div>
              <span className={s.featureIcon}>
                <FaRobot />
              </span>

              <div>
                <strong>Grounded AI recommendations</strong>
                <p>
                  AI works with verified database records instead of inventing
                  hotels, restaurants or attractions.
                </p>
              </div>
            </div>

            <div>
              <span className={s.featureIcon}>
                <FaShieldHalved />
              </span>

              <div>
                <strong>Secure and personalized</strong>
                <p>
                  Save trips, manage preferences and reopen your itineraries from
                  your private dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className={s.footer}>
        <div className={`container ${s.footerGrid}`}>
          <div className={s.footerBrand}>
            <Brand />

            <p>
              A smart budget travel platform that helps travellers discover
              destinations, compare suitable options and create realistic
              day-wise itineraries.
            </p>

            <div className={s.trustLine}>
              <span>
                <FaCircleCheck />
                Database-grounded
              </span>

              <span>
                <FaCircleCheck />
                Budget-aware
              </span>

              <span>
                <FaCircleCheck />
                AI-assisted
              </span>
            </div>
          </div>

          <div className={s.footerColumn}>
            <h3>Discover</h3>
            <Link to="/explore">Explore destinations</Link>
            <Link to="/register">Plan a new trip</Link>
            <Link to="/about">How TripGenie works</Link>
          </div>

          <div className={s.footerColumn}>
            <h3>Your account</h3>

            {user ? (
              <>
                <Link to={dashboardPath}>Dashboard</Link>
                <Link to="/saved-trips">Saved trips</Link>
                <Link to="/profile">Profile</Link>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Create account</Link>
              </>
            )}
          </div>

          <div className={s.footerColumn}>
            <h3>Why TripGenie?</h3>

            <span>
              <FaLocationDot />
              Verified travel data
            </span>

            <span>
              <FaPlaneDeparture />
              Day-wise itineraries
            </span>

            <span>
              <FaWallet />
              Accurate cost breakdowns
            </span>
          </div>
        </div>      
      </footer>
    </div>
  );
}