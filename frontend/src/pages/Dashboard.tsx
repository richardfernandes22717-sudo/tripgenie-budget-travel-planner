import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaArrowRight,
  FaBookmark,
  FaCalendarDays,
  FaChartPie,
  FaCircleExclamation,
  FaClockRotateLeft,
  FaCompass,
  FaHeart,
  FaIndianRupeeSign,
  FaLocationDot,
  FaMapLocationDot,
  FaPlaneDeparture,
  FaRoute,
  FaWandMagicSparkles,
} from 'react-icons/fa6';
import { Link } from 'react-router-dom';

import api, { imageUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Destination } from '../types';
import s from '../components/ui.module.css';

type TripSummary = {
  id: number;
  title: string;
  destination_id: number;
  destination_name: string;
  destination_image?: string;
  origin: string;
  start_date: string;
  end_date: string;
  traveller_count: number;
  total_budget: number | string;
  estimated_cost: number | string;
  remaining_budget: number | string;
  status: string;
  currency?: string;
};

const formatCurrency = (value: number | string | undefined) =>
  `₹${Number(value || 0).toLocaleString('en-IN')}`;

const formatDate = (value?: string) => {
  if (!value) return 'Date not available';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
};

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';

  return 'Good evening';
};

const getDaysUntil = (date: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tripDate = new Date(`${date.slice(0, 10)}T00:00:00`);
  const difference = tripDate.getTime() - today.getTime();

  return Math.max(0, Math.ceil(difference / 86_400_000));
};

const getTripDuration = (startDate: string, endDate: string) => {
  const start = new Date(`${startDate.slice(0, 10)}T00:00:00`);
  const end = new Date(`${endDate.slice(0, 10)}T00:00:00`);
  const difference = end.getTime() - start.getTime();

  return Math.max(1, Math.round(difference / 86_400_000) + 1);
};

export default function Dashboard() {
  const { user } = useAuth();

  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [tripResponse, destinationResponse] = await Promise.all([
        api.get('/trips'),
        api.get('/destinations/recommendations', {
          params: {
            budget: 25000,
          },
        }),
      ]);

      setTrips(
        Array.isArray(tripResponse.data.data)
          ? tripResponse.data.data
          : [],
      );

      setDestinations(
        Array.isArray(destinationResponse.data.data)
          ? destinationResponse.data.data
          : [],
      );
    } catch (requestError) {
      console.error('Dashboard loading error:', requestError);
      setError(
        'Your dashboard information could not be loaded. Confirm that the backend and MySQL are running.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const dashboardData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingTrips = trips
      .filter((trip) => {
        const startDate = new Date(
          `${trip.start_date.slice(0, 10)}T00:00:00`,
        );

        return (
          startDate >= today &&
          !['completed', 'cancelled'].includes(
            trip.status.toLowerCase(),
          )
        );
      })
      .sort(
        (first, second) =>
          new Date(first.start_date).getTime() -
          new Date(second.start_date).getTime(),
      );

    const completedTrips = trips.filter(
      (trip) => trip.status.toLowerCase() === 'completed',
    );

    const plannedBudget = trips.reduce(
      (total, trip) => total + Number(trip.total_budget || 0),
      0,
    );

    const estimatedSpend = trips.reduce(
      (total, trip) => total + Number(trip.estimated_cost || 0),
      0,
    );

    const remainingBudget = plannedBudget - estimatedSpend;

    const percentageUsed =
      plannedBudget > 0
        ? Math.round((estimatedSpend / plannedBudget) * 100)
        : 0;

    const uniqueDestinations = new Set(
      trips.map((trip) => trip.destination_id),
    ).size;

    return {
      upcomingTrips,
      completedTrips,
      nextTrip: upcomingTrips[0] ?? null,
      plannedBudget,
      estimatedSpend,
      remainingBudget,
      percentageUsed,
      uniqueDestinations,
    };
  }, [trips]);

  const firstName = user?.name?.split(' ')[0] || 'Traveller';

  const statusClass = (status: string) => {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === 'completed') {
      return s.dashboardStatusCompleted;
    }

    if (normalizedStatus === 'cancelled') {
      return s.dashboardStatusCancelled;
    }

    if (normalizedStatus === 'ongoing') {
      return s.dashboardStatusOngoing;
    }

    return s.dashboardStatusPlanned;
  };

  return (
    <div className={s.dashboardPage}>
      <section className={s.dashboardWelcome}>
        <div className={s.dashboardWelcomeContent}>
          <span className={s.dashboardEyebrow}>
            Your travel workspace
          </span>

          <h1>
            {getGreeting()}, {firstName}.
          </h1>

          <p>
            Review your upcoming journeys, monitor travel budgets and
            continue planning your next experience.
          </p>

          <div className={s.dashboardWelcomeActions}>
            <Link className={s.dashboardPrimaryButton} to="/plan-trip">
              <FaWandMagicSparkles />
              Plan a new trip
              <FaArrowRight />
            </Link>

            <Link
              className={s.dashboardSecondaryButton}
              to="/saved-trips"
            >
              View saved trips
            </Link>
          </div>
        </div>

        <div className={s.dashboardWelcomeVisual}>
          <img
            src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1000&q=85"
            alt="Indian travel destination"
          />

          <div className={s.dashboardWelcomeBadge}>
            <span>
              <FaCompass />
            </span>

            <div>
              <small>TripGenie planner</small>
              <strong>Ready for your next journey</strong>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className={s.dashboardError} role="alert">
          <span>
            <FaCircleExclamation />
          </span>

          <div>
            <strong>Dashboard unavailable</strong>
            <p>{error}</p>
          </div>

          <button type="button" onClick={() => void loadDashboard()}>
            Try again
          </button>
        </div>
      )}

      <section className={s.dashboardMetrics}>
        <motion.article
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className={s.dashboardMetricIcon}>
            <FaBookmark />
          </span>

          <div>
            <small>Trips planned</small>
            <strong>{loading ? '—' : trips.length}</strong>
            <p>Saved travel itineraries</p>
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
        >
          <span className={s.dashboardMetricIcon}>
            <FaPlaneDeparture />
          </span>

          <div>
            <small>Upcoming trips</small>
            <strong>
              {loading ? '—' : dashboardData.upcomingTrips.length}
            </strong>
            <p>Journeys waiting for you</p>
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <span className={s.dashboardMetricIcon}>
            <FaRoute />
          </span>

          <div>
            <small>Destinations</small>
            <strong>
              {loading ? '—' : dashboardData.uniqueDestinations}
            </strong>
            <p>Different places planned</p>
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          <span className={s.dashboardMetricIcon}>
            <FaIndianRupeeSign />
          </span>

          <div>
            <small>Estimated spend</small>
            <strong>
              {loading
                ? '—'
                : formatCurrency(dashboardData.estimatedSpend)}
            </strong>
            <p>Across all saved trips</p>
          </div>
        </motion.article>
      </section>

      <section className={s.dashboardMainGrid}>
        <article className={s.dashboardNextTrip}>
          <div className={s.dashboardPanelHeading}>
            <div>
              <span className={s.dashboardEyebrow}>
                Next adventure
              </span>
              <h2>Your upcoming journey</h2>
            </div>

            <Link to="/saved-trips">
              All trips
              <FaArrowRight />
            </Link>
          </div>

          {loading ? (
            <div className={s.dashboardLargeSkeleton} />
          ) : dashboardData.nextTrip ? (
            <Link
              className={s.dashboardNextTripCard}
              to={`/saved-trips/${dashboardData.nextTrip.id}`}
            >
              <div className={s.dashboardNextTripImage}>
                <img
                  src={imageUrl(
                    dashboardData.nextTrip.destination_image,
                  )}
                  alt={dashboardData.nextTrip.destination_name}
                  onError={(event) => {
                    event.currentTarget.src = '/fallback.svg';
                  }}
                />

                <span
                  className={`${s.dashboardTripStatus} ${statusClass(
                    dashboardData.nextTrip.status,
                  )}`}
                >
                  {dashboardData.nextTrip.status}
                </span>
              </div>

              <div className={s.dashboardNextTripBody}>
                <span className={s.dashboardLocation}>
                  <FaLocationDot />
                  {dashboardData.nextTrip.destination_name}
                </span>

                <h3>{dashboardData.nextTrip.title}</h3>

                <div className={s.dashboardNextTripDetails}>
                  <span>
                    <FaCalendarDays />
                    <small>Travel dates</small>
                    <strong>
                      {formatDate(
                        dashboardData.nextTrip.start_date,
                      )}{' '}
                      –{' '}
                      {formatDate(dashboardData.nextTrip.end_date)}
                    </strong>
                  </span>

                  <span>
                    <FaRoute />
                    <small>Duration</small>
                    <strong>
                      {getTripDuration(
                        dashboardData.nextTrip.start_date,
                        dashboardData.nextTrip.end_date,
                      )}{' '}
                      days
                    </strong>
                  </span>

                  <span>
                    <FaIndianRupeeSign />
                    <small>Estimated cost</small>
                    <strong>
                      {formatCurrency(
                        dashboardData.nextTrip.estimated_cost,
                      )}
                    </strong>
                  </span>
                </div>

                <div className={s.dashboardNextTripFooter}>
                  <span>
                    {getDaysUntil(
                      dashboardData.nextTrip.start_date,
                    ) === 0
                      ? 'Your trip starts today'
                      : `${getDaysUntil(
                          dashboardData.nextTrip.start_date,
                        )} days until departure`}
                  </span>

                  <strong>
                    Open itinerary
                    <FaArrowRight />
                  </strong>
                </div>
              </div>
            </Link>
          ) : (
            <div className={s.dashboardNoTrip}>
              <span>
                <FaMapLocationDot />
              </span>

              <h3>No upcoming journey yet</h3>

              <p>
                Create a budget-friendly itinerary and your next trip
                will appear here.
              </p>

              <Link to="/plan-trip">
                Plan my first trip
                <FaArrowRight />
              </Link>
            </div>
          )}
        </article>

        <article className={s.dashboardBudgetCard}>
          <div className={s.dashboardPanelHeading}>
            <div>
              <span className={s.dashboardEyebrow}>
                Budget overview
              </span>
              <h2>Travel spending</h2>
            </div>

            <span className={s.dashboardBudgetIcon}>
              <FaChartPie />
            </span>
          </div>

          <div className={s.dashboardBudgetTotal}>
            <small>Total estimated</small>

            <strong>
              {loading
                ? '—'
                : formatCurrency(dashboardData.estimatedSpend)}
            </strong>

            <span>
              of {formatCurrency(dashboardData.plannedBudget)} planned
            </span>
          </div>

          <div className={s.dashboardBudgetProgress}>
            <span
              style={{
                width: `${Math.min(
                  dashboardData.percentageUsed,
                  100,
                )}%`,
              }}
            />
          </div>

          <div className={s.dashboardBudgetPercentage}>
            <span>Budget used</span>
            <strong>{dashboardData.percentageUsed}%</strong>
          </div>

          <div className={s.dashboardBudgetBreakdown}>
            <div>
              <span>Planned budget</span>
              <strong>
                {formatCurrency(dashboardData.plannedBudget)}
              </strong>
            </div>

            <div>
              <span>Estimated spend</span>
              <strong>
                {formatCurrency(dashboardData.estimatedSpend)}
              </strong>
            </div>

            <div>
              <span>
                {dashboardData.remainingBudget >= 0
                  ? 'Remaining'
                  : 'Over budget'}
              </span>

              <strong
                className={
                  dashboardData.remainingBudget < 0
                    ? s.dashboardNegativeAmount
                    : ''
                }
              >
                {formatCurrency(
                  Math.abs(dashboardData.remainingBudget),
                )}
              </strong>
            </div>
          </div>

          <Link
            className={s.dashboardBudgetLink}
            to="/saved-trips"
          >
            Review trip budgets
            <FaArrowRight />
          </Link>
        </article>
      </section>

      <section className={s.dashboardSection}>
        <div className={s.dashboardSectionHeading}>
          <div>
            <span className={s.dashboardEyebrow}>Recent plans</span>
            <h2>Continue where you left off</h2>
            <p>
              Reopen your latest itineraries and continue making
              changes.
            </p>
          </div>

          <Link to="/saved-trips">
            View every trip
            <FaArrowRight />
          </Link>
        </div>

        {loading ? (
          <div className={s.dashboardTripGrid}>
            {[1, 2, 3].map((item) => (
              <div
                className={s.dashboardTripSkeleton}
                key={item}
              />
            ))}
          </div>
        ) : trips.length > 0 ? (
          <div className={s.dashboardTripGrid}>
            {trips.slice(0, 3).map((trip, index) => (
              <motion.article
                className={s.dashboardTripCard}
                key={trip.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07 }}
              >
                <Link to={`/saved-trips/${trip.id}`}>
                  <div className={s.dashboardTripImage}>
                    <img
                      src={imageUrl(trip.destination_image)}
                      alt={trip.destination_name}
                      onError={(event) => {
                        event.currentTarget.src = '/fallback.svg';
                      }}
                    />

                    <span
                      className={`${s.dashboardTripStatus} ${statusClass(
                        trip.status,
                      )}`}
                    >
                      {trip.status}
                    </span>
                  </div>

                  <div className={s.dashboardTripBody}>
                    <span className={s.dashboardLocation}>
                      <FaLocationDot />
                      {trip.destination_name}
                    </span>

                    <h3>{trip.title}</h3>

                    <p>
                      {formatDate(trip.start_date)} ·{' '}
                      {getTripDuration(
                        trip.start_date,
                        trip.end_date,
                      )}{' '}
                      days · {trip.traveller_count}{' '}
                      {Number(trip.traveller_count) === 1
                        ? 'traveller'
                        : 'travellers'}
                    </p>

                    <div className={s.dashboardTripFooter}>
                      <div>
                        <small>Estimated cost</small>
                        <strong>
                          {formatCurrency(trip.estimated_cost)}
                        </strong>
                      </div>

                      <span>
                        Open
                        <FaArrowRight />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className={s.dashboardEmptyState}>
            <FaBookmark />
            <h3>No saved trips</h3>
            <p>
              Generated and saved travel plans will appear here.
            </p>
            <Link to="/plan-trip">Create a travel plan</Link>
          </div>
        )}
      </section>

      <section className={s.dashboardLowerGrid}>
        <article className={s.dashboardRecommendations}>
          <div className={s.dashboardSectionHeading}>
            <div>
              <span className={s.dashboardEyebrow}>
                Recommended for you
              </span>
              <h2>Explore under ₹25,000</h2>
            </div>

            <Link to="/explore">
              Explore all
              <FaArrowRight />
            </Link>
          </div>

          <div className={s.dashboardRecommendationGrid}>
            {loading
              ? [1, 2, 3].map((item) => (
                  <div
                    className={s.dashboardRecommendationSkeleton}
                    key={item}
                  />
                ))
              : destinations.slice(0, 3).map((destination) => (
                  <Link
                    className={s.dashboardRecommendationCard}
                    to={`/explore/${destination.id}`}
                    key={destination.id}
                  >
                    <img
                      src={imageUrl(destination.image)}
                      alt={destination.name}
                      onError={(event) => {
                        event.currentTarget.src = '/fallback.svg';
                      }}
                    />

                    <div>
                      <span>{destination.category}</span>
                      <h3>{destination.name}</h3>

                      <p>
                        <FaLocationDot />
                        {destination.city}, {destination.state}
                      </p>

                      <strong>
                        From{' '}
                        {formatCurrency(destination.minimum_budget)}
                      </strong>
                    </div>
                  </Link>
                ))}
          </div>
        </article>

        <aside className={s.dashboardQuickActions}>
          <span className={s.dashboardEyebrow}>Quick actions</span>
          <h2>What would you like to do?</h2>

          <div>
            <Link to="/plan-trip">
              <span>
                <FaWandMagicSparkles />
              </span>

              <div>
                <strong>Plan a new trip</strong>
                <small>Create a complete itinerary</small>
              </div>

              <FaArrowRight />
            </Link>

            <Link to="/explore">
              <span>
                <FaCompass />
              </span>

              <div>
                <strong>Explore destinations</strong>
                <small>Find places within your budget</small>
              </div>

              <FaArrowRight />
            </Link>

            <Link to="/favourites">
              <span>
                <FaHeart />
              </span>

              <div>
                <strong>Open favourites</strong>
                <small>Review your saved destinations</small>
              </div>

              <FaArrowRight />
            </Link>

            <Link to="/trip-history">
              <span>
                <FaClockRotateLeft />
              </span>

              <div>
                <strong>View trip history</strong>
                <small>
                  {dashboardData.completedTrips.length} completed trips
                </small>
              </div>

              <FaArrowRight />
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}