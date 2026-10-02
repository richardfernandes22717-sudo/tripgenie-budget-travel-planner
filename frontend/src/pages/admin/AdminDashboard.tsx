import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import axios from 'axios';
import {
  FaArrowRight,
  FaBrain,
  FaChartLine,
  FaCircleExclamation,
  FaClock,
  FaDatabase,
  FaHotel,
  FaLandmark,
  FaMapLocationDot,
  FaRobot,
  FaRotate,
  FaRoute,
  FaShieldHalved,
  FaStar,
  FaTicket,
  FaUsers,
  FaUtensils,
} from 'react-icons/fa6';
import { Link } from 'react-router-dom';

import api from '../../api/client';
import s from '../../components/ui.module.css';

type AdminCounts = Record<
  string,
  number | string | null | undefined
>;

type RecentTripActivity = {
  day: string;
  count: number | string;
};

type AIStatistic = {
  endpoint: string;
  source: string;
  status: string;
  count: number | string;
  average_ms: number | string | null;
};

type AdminStatistics = {
  counts: AdminCounts;
  recentTrips: RecentTripActivity[];
  aiBreakdown: AIStatistic[];
};

const formatNumber = (value: unknown) =>
  Number(value || 0).toLocaleString('en-IN');

const formatDate = (value?: string) => {
  if (!value) return 'Unknown';

  const normalizedDate = value.slice(0, 10);

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${normalizedDate}T00:00:00`));
};

const formatEndpoint = (value?: string) =>
  (value || 'Unknown request')
    .replace('/api/ai/', '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function AdminDashboard() {
  const [data, setData] =
    useState<AdminStatistics | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/admin/stats');
      const responseData = response.data.data || {};

      setData({
        counts: responseData.counts || {},
        recentTrips: Array.isArray(responseData.recentTrips)
          ? responseData.recentTrips
          : [],
        aiBreakdown: Array.isArray(responseData.aiBreakdown)
          ? responseData.aiBreakdown
          : [],
      });

      setLastUpdated(new Date());
    } catch (requestError: unknown) {
      const requestMessage = axios.isAxiosError(requestError)
        ? requestError.response?.data?.message
        : null;

      setError(
        requestMessage ||
          'Administration statistics could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatistics();
  }, [loadStatistics]);

  const getCount = (key: string) =>
    Number(data?.counts?.[key] || 0);

  const summary = useMemo(() => {
    const catalogueRecords =
      getCount('destinations') +
      getCount('hotels') +
      getCount('restaurants') +
      getCount('attractions');

    const aiBreakdownTotal = (data?.aiBreakdown || []).reduce(
      (total, item) => total + Number(item.count || 0),
      0,
    );

    const aiRequests =
      getCount('ai_request_logs') || aiBreakdownTotal;

    const successfulAIRequests = (
      data?.aiBreakdown || []
    ).reduce(
      (total, item) =>
        item.status?.toLowerCase() === 'success'
          ? total + Number(item.count || 0)
          : total,
      0,
    );

    const aiSuccessRate =
      aiRequests > 0
        ? Math.round(
            (successfulAIRequests / aiRequests) * 100,
          )
        : 0;

    return {
      catalogueRecords,
      aiRequests,
      aiSuccessRate,
    };
  }, [data]);

  const maximumTripActivity = useMemo(
    () =>
      Math.max(
        1,
        ...(data?.recentTrips || []).map((item) =>
          Number(item.count || 0),
        ),
      ),
    [data],
  );

  const primaryMetrics = [
    {
      label: 'Registered users',
      value: getCount('users'),
      description: 'Traveller and administrator accounts',
      icon: FaUsers,
      link: '/admin/users',
    },
    {
      label: 'Destinations',
      value: getCount('destinations'),
      description: 'Travel destinations in the catalogue',
      icon: FaMapLocationDot,
      link: '/admin/destinations',
    },
    {
      label: 'Saved trips',
      value: getCount('trips'),
      description: 'Generated and saved itineraries',
      icon: FaRoute,
      link: '/admin/trips',
    },
    {
      label: 'Bookings',
      value: getCount('bookings'),
      description: 'Booking records created by users',
      icon: FaTicket,
      link: '/admin/bookings',
    },
    {
      label: 'Catalogue records',
      value: summary.catalogueRecords,
      description: 'Destinations, stays and experiences',
      icon: FaDatabase,
      link: '/admin/destinations',
    },
    {
      label: 'AI requests',
      value: summary.aiRequests,
      description: 'Planning and assistant requests',
      icon: FaRobot,
      link: '/admin/ai-statistics',
    },
  ];

  const managementModules = [
    {
      title: 'Destination management',
      description:
        'Manage cities, states, travel budgets, seasons and destination information.',
      count: getCount('destinations'),
      icon: FaMapLocationDot,
      link: '/admin/destinations',
    },
    {
      title: 'Hotel management',
      description:
        'Maintain hotel prices, room types, amenities and availability.',
      count: getCount('hotels'),
      icon: FaHotel,
      link: '/admin/hotels',
    },
    {
      title: 'Restaurant management',
      description:
        'Update cuisines, meal costs, dietary support and operating hours.',
      count: getCount('restaurants'),
      icon: FaUtensils,
      link: '/admin/restaurants',
    },
    {
      title: 'Attraction management',
      description:
        'Control attraction details, entry fees, timings and categories.',
      count: getCount('attractions'),
      icon: FaLandmark,
      link: '/admin/attractions',
    },
    {
      title: 'Review moderation',
      description:
        'Review user feedback and manage its publication status.',
      count: getCount('reviews'),
      icon: FaStar,
      link: '/admin/reviews',
    },
    {
      title: 'Trip monitoring',
      description:
        'Review saved travel plans and monitor itinerary activity.',
      count: getCount('trips'),
      icon: FaRoute,
      link: '/admin/trips',
    },
  ];

  return (
    <div className={s.adminDashPage}>
      <section className={s.adminDashHero}>
        <div className={s.adminDashHeroContent}>
          <span className={s.adminDashEyebrow}>
            <FaShieldHalved />
            Administration centre
          </span>

          <h1>
            Manage the platform behind every TripGenie journey.
          </h1>

          <p>
            Review platform activity, maintain travel catalogue
            records and monitor the data used for recommendations and
            itinerary generation.
          </p>

          <div className={s.adminDashHeroActions}>
            <Link to="/admin/destinations">
              <FaMapLocationDot />
              Manage destinations
              <FaArrowRight />
            </Link>

            <button
              type="button"
              onClick={() => void loadStatistics()}
              disabled={loading}
            >
              <FaRotate />
              {loading ? 'Refreshing...' : 'Refresh statistics'}
            </button>
          </div>
        </div>

        <aside className={s.adminDashSystemCard}>
          <span className={s.adminDashSystemIcon}>
            <FaChartLine />
          </span>

          <div>
            <small>Platform status</small>

            <strong>
              {loading
                ? 'Checking system'
                : error
                  ? 'Requires attention'
                  : 'Operations normal'}
            </strong>

            <p>
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString(
                    'en-IN',
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                    },
                  )}`
                : 'Waiting for platform statistics'}
            </p>
          </div>

          <span
            className={`${s.adminDashStatusDot} ${
              error
                ? s.adminDashStatusError
                : s.adminDashStatusOnline
            }`}
          />
        </aside>
      </section>

      {error && (
        <div className={s.adminDashError}>
          <span>
            <FaCircleExclamation />
          </span>

          <div>
            <strong>Statistics unavailable</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() => void loadStatistics()}
          >
            Try again
          </button>
        </div>
      )}

      <section className={s.adminDashMetrics}>
        {primaryMetrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <Link to={metric.link} key={metric.label}>
              <span className={s.adminDashMetricIcon}>
                <Icon />
              </span>

              <div>
                <small>{metric.label}</small>

                <strong>
                  {loading ? '—' : formatNumber(metric.value)}
                </strong>

                <p>{metric.description}</p>
              </div>

              <FaArrowRight />
            </Link>
          );
        })}
      </section>

      <section className={s.adminDashAnalytics}>
        <article className={s.adminDashActivityCard}>
          <header className={s.adminDashPanelHeader}>
            <div>
              <span className={s.adminDashEyebrow}>
                Recent activity
              </span>

              <h2>Trip creation activity</h2>

              <p>
                Daily trip-generation activity from the latest
                recorded period.
              </p>
            </div>

            <span>
              <FaChartLine />
            </span>
          </header>

          {loading ? (
            <div className={s.adminDashChartSkeleton} />
          ) : data?.recentTrips.length ? (
            <div className={s.adminDashChart}>
              <div className={s.adminDashChartScale}>
                <span>{maximumTripActivity}</span>
                <span>
                  {Math.round(maximumTripActivity / 2)}
                </span>
                <span>0</span>
              </div>

              <div className={s.adminDashBars}>
                {[...data.recentTrips]
                  .reverse()
                  .map((activity) => {
                    const activityCount = Number(
                      activity.count || 0,
                    );

                    const height = Math.max(
                      8,
                      (activityCount /
                        maximumTripActivity) *
                        100,
                    );

                    return (
                      <div key={activity.day}>
                        <div>
                          <span
                            style={{
                              height: `${height}%`,
                            }}
                          >
                            <strong>
                              {activityCount}
                            </strong>
                          </span>
                        </div>

                        <small>
                          {formatDate(activity.day)}
                        </small>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className={s.adminDashEmptyChart}>
              <FaChartLine />
              <strong>No recent trip activity</strong>

              <p>
                New itinerary activity will appear here.
              </p>
            </div>
          )}

          <footer className={s.adminDashChartFooter}>
            <span>
              <FaClock />
              Latest recorded activity
            </span>

            <Link to="/admin/trips">
              Open trip monitoring
              <FaArrowRight />
            </Link>
          </footer>
        </article>

        <article className={s.adminDashCoverageCard}>
          <header className={s.adminDashPanelHeader}>
            <div>
              <span className={s.adminDashEyebrow}>
                Data coverage
              </span>

              <h2>Travel catalogue</h2>

              <p>
                Records available to destination and itinerary
                features.
              </p>
            </div>

            <span>
              <FaDatabase />
            </span>
          </header>

          <div className={s.adminDashCoverageRows}>
            <div>
              <span>
                <FaMapLocationDot />
                Destinations
              </span>

              <strong>
                {loading
                  ? '—'
                  : formatNumber(getCount('destinations'))}
              </strong>
            </div>

            <div>
              <span>
                <FaHotel />
                Hotels
              </span>

              <strong>
                {loading
                  ? '—'
                  : formatNumber(getCount('hotels'))}
              </strong>
            </div>

            <div>
              <span>
                <FaUtensils />
                Restaurants
              </span>

              <strong>
                {loading
                  ? '—'
                  : formatNumber(getCount('restaurants'))}
              </strong>
            </div>

            <div>
              <span>
                <FaLandmark />
                Attractions
              </span>

              <strong>
                {loading
                  ? '—'
                  : formatNumber(getCount('attractions'))}
              </strong>
            </div>
          </div>

          <div className={s.adminDashCoverageTotal}>
            <div>
              <small>Total catalogue records</small>

              <strong>
                {loading
                  ? '—'
                  : formatNumber(summary.catalogueRecords)}
              </strong>
            </div>

            <span>
              <FaDatabase />
              Available to TripGenie
            </span>
          </div>
        </article>
      </section>

      <section className={s.adminDashSection}>
        <div className={s.adminDashSectionHeading}>
          <span className={s.adminDashEyebrow}>
            Management modules
          </span>

          <h2>Control the TripGenie catalogue</h2>

          <p>
            Open a management module to search, create, edit or remove
            database records.
          </p>
        </div>

        <div className={s.adminDashModuleGrid}>
          {managementModules.map((module) => {
            const Icon = module.icon;

            return (
              <Link to={module.link} key={module.title}>
                <header>
                  <span>
                    <Icon />
                  </span>

                  <strong>
                    {loading ? '—' : formatNumber(module.count)}
                  </strong>
                </header>

                <h3>{module.title}</h3>
                <p>{module.description}</p>

                <footer>
                  Manage records
                  <FaArrowRight />
                </footer>
              </Link>
            );
          })}
        </div>
      </section>

      <section className={s.adminDashBottomGrid}>
        <article className={s.adminDashAICard}>
          <header className={s.adminDashPanelHeader}>
            <div>
              <span className={s.adminDashEyebrow}>
                AI operations
              </span>

              <h2>Request performance</h2>

              <p>
                Monitor Groq and fallback request sources, statuses and
                response times.
              </p>
            </div>

            <span>
              <FaBrain />
            </span>
          </header>

          <div className={s.adminDashAISummary}>
            <article>
              <small>Total requests</small>
              <strong>
                {loading
                  ? '—'
                  : formatNumber(summary.aiRequests)}
              </strong>
            </article>

            <article>
              <small>Success rate</small>
              <strong>
                {loading
                  ? '—'
                  : `${summary.aiSuccessRate}%`}
              </strong>
            </article>
          </div>

          {loading ? (
            <div className={s.adminDashTableSkeleton} />
          ) : data?.aiBreakdown.length ? (
            <div className={s.adminDashAITable}>
              <div className={s.adminDashAITableHeader}>
                <span>Request</span>
                <span>Source</span>
                <span>Status</span>
                <span>Count</span>
                <span>Average</span>
              </div>

              {data.aiBreakdown
                .slice(0, 6)
                .map((item, index) => (
                  <div
                    className={s.adminDashAITableRow}
                    key={`${item.endpoint}-${item.source}-${item.status}-${index}`}
                  >
                    <strong>
                      {formatEndpoint(item.endpoint)}
                    </strong>

                    <span>{item.source || 'unknown'}</span>

                    <span
                      className={
                        item.status?.toLowerCase() ===
                        'success'
                          ? s.adminDashAISuccess
                          : s.adminDashAIWarning
                      }
                    >
                      {item.status || 'unknown'}
                    </span>

                    <span>{formatNumber(item.count)}</span>

                    <span>
                      {item.average_ms !== null &&
                      item.average_ms !== undefined
                        ? `${formatNumber(
                            item.average_ms,
                          )} ms`
                        : '—'}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div className={s.adminDashAIEmpty}>
              <FaRobot />
              <strong>No AI request records yet</strong>

              <p>
                Statistics will appear after users generate
                itineraries or use the assistant.
              </p>
            </div>
          )}

          <Link
            className={s.adminDashPanelLink}
            to="/admin/ai-statistics"
          >
            Open complete AI statistics
            <FaArrowRight />
          </Link>
        </article>

        <aside className={s.adminDashQuickActions}>
          <span className={s.adminDashEyebrow}>
            Quick actions
          </span>

          <h2>Common admin tasks</h2>

          <div>
            <Link to="/admin/destinations">
              <span>
                <FaMapLocationDot />
              </span>

              <div>
                <strong>Manage destinations</strong>
                <small>
                  Add or update travel locations
                </small>
              </div>

              <FaArrowRight />
            </Link>

            <Link to="/admin/hotels">
              <span>
                <FaHotel />
              </span>

              <div>
                <strong>Update hotel records</strong>
                <small>
                  Maintain rooms and pricing
                </small>
              </div>

              <FaArrowRight />
            </Link>

            <Link to="/admin/users">
              <span>
                <FaUsers />
              </span>

              <div>
                <strong>Manage user access</strong>
                <small>
                  Update roles and account status
                </small>
              </div>

              <FaArrowRight />
            </Link>

            <Link to="/admin/reviews">
              <span>
                <FaStar />
              </span>

              <div>
                <strong>Moderate reviews</strong>
                <small>
                  Review traveller feedback
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