import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  FaArrowRight,
  FaCalendarCheck,
  FaCalendarDays,
  FaCircleCheck,
  FaCircleExclamation,
  FaClockRotateLeft,
  FaCompass,
  FaIndianRupeeSign,
  FaLocationDot,
  FaMagnifyingGlass,
  FaMapLocationDot,
  FaRoute,
  FaUsers,
  FaXmark,
} from 'react-icons/fa6';
import { Link } from 'react-router-dom';

import api, { imageUrl } from '../api/client';
import s from '../components/ui.module.css';

type HistoryTrip = {
  id: number;
  title: string;
  destination_id: number;
  destination_name: string;
  destination_image?: string;
  origin?: string;
  start_date: string;
  end_date: string;
  traveller_count: number;
  total_budget: number | string;
  estimated_cost: number | string;
  remaining_budget: number | string;
  status: string;
};

const formatMoney = (value: unknown) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;

const formatDate = (value?: string) => {
  if (!value) return 'Date unavailable';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
};

const calculateDuration = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return 1;

  const start = new Date(`${startDate.slice(0, 10)}T00:00:00`);
  const end = new Date(`${endDate.slice(0, 10)}T00:00:00`);

  return Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1,
  );
};

const isPastTrip = (trip: HistoryTrip) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(
    `${trip.end_date.slice(0, 10)}T00:00:00`,
  );

  return endDate < today;
};

export default function TripHistory() {
  const [trips, setTrips] = useState<HistoryTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadTrips = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/trips');

      setTrips(
        Array.isArray(response.data.data) ? response.data.data : [],
      );
    } catch (requestError: unknown) {
      const requestMessage = axios.isAxiosError(requestError)
        ? requestError.response?.data?.message
        : null;

      setError(requestMessage || 'Trip history could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  const historyTrips = useMemo(
    () =>
      trips
        .filter((trip) => {
          const status = trip.status.toLowerCase();

          return (
            status === 'completed' ||
            status === 'cancelled' ||
            isPastTrip(trip)
          );
        })
        .sort(
          (first, second) =>
            new Date(second.end_date).getTime() -
            new Date(first.end_date).getTime(),
        ),
    [trips],
  );

  const filteredTrips = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return historyTrips.filter((trip) => {
      const status = trip.status.toLowerCase();

      let matchesStatus = true;

      if (statusFilter === 'completed') {
        matchesStatus = status === 'completed';
      }

      if (statusFilter === 'cancelled') {
        matchesStatus = status === 'cancelled';
      }

      if (statusFilter === 'past') {
        matchesStatus =
          isPastTrip(trip) &&
          status !== 'completed' &&
          status !== 'cancelled';
      }

      const matchesSearch =
        !normalizedSearch ||
        trip.title.toLowerCase().includes(normalizedSearch) ||
        trip.destination_name
          .toLowerCase()
          .includes(normalizedSearch) ||
        trip.origin?.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [historyTrips, search, statusFilter]);

  const summary = useMemo(() => {
    const completed = historyTrips.filter(
      (trip) => trip.status.toLowerCase() === 'completed',
    ).length;

    const cancelled = historyTrips.filter(
      (trip) => trip.status.toLowerCase() === 'cancelled',
    ).length;

    const totalEstimated = historyTrips.reduce(
      (total, trip) => total + Number(trip.estimated_cost || 0),
      0,
    );

    const destinations = new Set(
      historyTrips.map((trip) => trip.destination_id),
    ).size;

    return {
      total: historyTrips.length,
      completed,
      cancelled,
      totalEstimated,
      destinations,
    };
  }, [historyTrips]);

  const getHistoryStatus = (trip: HistoryTrip) => {
    const status = trip.status.toLowerCase();

    if (status === 'completed') {
      return {
        label: 'Completed',
        className: s.tripHistoryStatusCompleted,
      };
    }

    if (status === 'cancelled') {
      return {
        label: 'Cancelled',
        className: s.tripHistoryStatusCancelled,
      };
    }

    return {
      label: 'Past trip',
      className: s.tripHistoryStatusPast,
    };
  };

  return (
    <div className={s.tripHistoryPage}>
      <section className={s.tripHistoryHero}>
        <div className={s.tripHistoryHeroContent}>
          <span className={s.tripHistoryEyebrow}>
            Your travel memories
          </span>

          <h1>Every journey becomes part of your story.</h1>

          <p>
            Revisit completed travel plans, review previous budgets
            and use earlier journeys as inspiration for your next
            destination.
          </p>

          <Link to="/plan-trip">
            Plan another journey
            <FaArrowRight />
          </Link>
        </div>

        <div className={s.tripHistoryHeroVisual}>
          <span>
            <FaClockRotateLeft />
          </span>

          <div>
            <small>Trips in your history</small>
            <strong>{loading ? '—' : summary.total}</strong>
            <p>Past, completed and cancelled journeys</p>
          </div>
        </div>
      </section>

      {error && (
        <div className={s.tripHistoryError}>
          <FaCircleExclamation />

          <div>
            <strong>History unavailable</strong>
            <p>{error}</p>
          </div>

          <button type="button" onClick={() => void loadTrips()}>
            Try again
          </button>
        </div>
      )}

      <section className={s.tripHistoryMetrics}>
        <article>
          <span>
            <FaClockRotateLeft />
          </span>

          <div>
            <small>History entries</small>
            <strong>{loading ? '—' : summary.total}</strong>
            <p>Journeys from earlier dates</p>
          </div>
        </article>

        <article>
          <span>
            <FaCircleCheck />
          </span>

          <div>
            <small>Completed trips</small>
            <strong>{loading ? '—' : summary.completed}</strong>
            <p>Successfully finished journeys</p>
          </div>
        </article>

        <article>
          <span>
            <FaCompass />
          </span>

          <div>
            <small>Places explored</small>
            <strong>{loading ? '—' : summary.destinations}</strong>
            <p>Different planned destinations</p>
          </div>
        </article>

        <article>
          <span>
            <FaIndianRupeeSign />
          </span>

          <div>
            <small>Historical estimate</small>
            <strong>
              {loading
                ? '—'
                : formatMoney(summary.totalEstimated)}
            </strong>
            <p>Across all previous journeys</p>
          </div>
        </article>
      </section>

      <section className={s.tripHistoryToolbar}>
        <div>
          <span>
            <FaCalendarCheck />
          </span>

          <div>
            <h2>Browse your journey history</h2>
            <p>
              Search earlier trips or filter them by their final
              status.
            </p>
          </div>
        </div>

        <div className={s.tripHistoryFilters}>
          <label>
            <FaMagnifyingGlass />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search previous trips"
            />

            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch('')}
              >
                <FaXmark />
              </button>
            )}
          </label>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="all">All history</option>
            <option value="completed">Completed</option>
            <option value="past">Past trips</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </section>

      <div className={s.tripHistoryResultsHeading}>
        <div>
          <strong>
            {loading
              ? 'Loading history...'
              : `${filteredTrips.length} ${
                  filteredTrips.length === 1
                    ? 'journey'
                    : 'journeys'
                } found`}
          </strong>

          <span>
            Open a previous itinerary or use its destination to plan
            another trip.
          </span>
        </div>

        {(search || statusFilter !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
            }}
          >
            Reset filters
          </button>
        )}
      </div>

      {loading ? (
        <div className={s.tripHistoryGrid}>
          {[1, 2, 3, 4].map((item) => (
            <div
              className={s.tripHistorySkeleton}
              key={item}
            />
          ))}
        </div>
      ) : filteredTrips.length > 0 ? (
        <div className={s.tripHistoryGrid}>
          {filteredTrips.map((trip) => {
            const historyStatus = getHistoryStatus(trip);

            return (
              <article
                className={s.tripHistoryCard}
                key={trip.id}
              >
                <div className={s.tripHistoryCardImage}>
                  <img
                    src={imageUrl(trip.destination_image)}
                    alt={trip.destination_name}
                    onError={(event) => {
                      event.currentTarget.src = '/fallback.svg';
                    }}
                  />

                  <span className={historyStatus.className}>
                    {historyStatus.label}
                  </span>

                  <div>
                    <FaMapLocationDot />
                    {trip.destination_name}
                  </div>
                </div>

                <div className={s.tripHistoryCardBody}>
                  <span className={s.tripHistoryLocation}>
                    <FaLocationDot />
                    {trip.origin
                      ? `${trip.origin} to ${trip.destination_name}`
                      : trip.destination_name}
                  </span>

                  <h2>{trip.title}</h2>

                  <div className={s.tripHistoryCardMeta}>
                    <span>
                      <FaCalendarDays />
                      <small>Travel period</small>
                      <strong>
                        {formatDate(trip.start_date)} –{' '}
                        {formatDate(trip.end_date)}
                      </strong>
                    </span>

                    <span>
                      <FaRoute />
                      <small>Duration</small>
                      <strong>
                        {calculateDuration(
                          trip.start_date,
                          trip.end_date,
                        )}{' '}
                        days
                      </strong>
                    </span>

                    <span>
                      <FaUsers />
                      <small>Travellers</small>
                      <strong>{trip.traveller_count}</strong>
                    </span>
                  </div>

                  <div className={s.tripHistoryBudget}>
                    <div>
                      <small>Original budget</small>
                      <strong>
                        {formatMoney(trip.total_budget)}
                      </strong>
                    </div>

                    <div>
                      <small>Estimated cost</small>
                      <strong>
                        {formatMoney(trip.estimated_cost)}
                      </strong>
                    </div>
                  </div>

                  <footer className={s.tripHistoryCardFooter}>
                    <Link to={`/saved-trips/${trip.id}`}>
                      View itinerary
                      <FaArrowRight />
                    </Link>

                    <Link
                      to={`/plan-trip?destination=${trip.destination_id}`}
                    >
                      Plan again
                    </Link>
                  </footer>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={s.tripHistoryEmpty}>
          <span>
            <FaClockRotateLeft />
          </span>

          <h2>
            {historyTrips.length === 0
              ? 'Your trip history is empty'
              : 'No matching journeys'}
          </h2>

          <p>
            {historyTrips.length === 0
              ? 'Completed and earlier journeys will appear here automatically.'
              : 'Try another search term or remove the selected history filter.'}
          </p>

          {historyTrips.length === 0 ? (
            <Link to="/plan-trip">
              Plan a new journey
              <FaArrowRight />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
              }}
            >
              Show all history
            </button>
          )}
        </div>
      )}
    </div>
  );
}