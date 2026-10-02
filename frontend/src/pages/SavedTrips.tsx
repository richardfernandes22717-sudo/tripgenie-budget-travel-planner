import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import axios from 'axios';
import {
  FaArrowLeft,
  FaArrowRight,
  FaCalendarDays,
  FaCircleCheck,
  FaCircleExclamation,
  FaClock,
  FaCompass,
  FaHotel,
  FaIndianRupeeSign,
  FaLocationDot,
  FaMagnifyingGlass,
  FaMapLocationDot,
  FaPen,
  FaPlus,
  FaRoute,
  FaSliders,
  FaTrash,
  FaUsers,
  FaWallet,
  FaXmark,
} from 'react-icons/fa6';
import { Link, useNavigate, useParams } from 'react-router-dom';

import api, { imageUrl } from '../api/client';
import ConfirmModal from '../components/ConfirmModal';
import s from '../components/ui.module.css';

type TripListItem = {
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

type TripItem = {
  id: number;
  item_type: string;
  related_record_id?: number;
  title: string;
  location: string;
  start_time: string;
  end_time: string;
  travel_minutes: number;
  estimated_cost: number;
  notes: string;
};

type TripDay = {
  id: number;
  day_number: number;
  trip_date: string;
  title: string;
  daily_total: number | string;
  items: TripItem[];
};

type TripDetail = TripListItem & {
  selected_hotel_id?: number;
  selected_hotel_name?: string;
  selected_hotel_image?: string;
  selected_hotel_location?: string;
  selected_hotel_rating?: number;
  selected_hotel_price?: number | string;
  selected_hotel_room_type?: string;
  days: TripDay[];
};

type DestinationCatalog = {
  hotels?: Array<{
    id: number;
    name: string;
    image?: string;
    location?: string;
    rating?: number;
    room_type?: string;
    hotel_type?: string;
    price_per_night: number | string;
  }>;

  restaurants?: Array<{
    id: number;
    name: string;
    average_cost_per_person: number | string;
  }>;

  attractions?: Array<{
    id: number;
    name: string;
    entry_fee: number | string;
  }>;
};

type EditItem = {
  id: number;
  title: string;
  location: string;
  start_time: string;
  end_time: string;
  travel_minutes: number;
  estimated_cost: number;
  notes: string;
};

type Message = {
  type: 'success' | 'error';
  text: string;
} | null;

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

const getStatusText = (status?: string) => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'draft') return 'Draft';
  if (normalizedStatus === 'completed') return 'Completed';
  if (normalizedStatus === 'cancelled') return 'Cancelled';

  return 'Planned';
};

export default function SavedTrips() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trips, setTrips] = useState<TripListItem[]>([]);
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [catalog, setCatalog] =
    useState<DestinationCatalog | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState<Message>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<EditItem | null>(null);
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [replacements, setReplacements] = useState<
    Record<number, number>
  >({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      if (id) {
        const tripResponse = await api.get(`/trips/${id}`);
        const tripData = tripResponse.data.data as TripDetail;

        setTrip(tripData);

        setSelectedHotelId(
          tripData.selected_hotel_id
            ? String(tripData.selected_hotel_id)
            : '',
        );

        const catalogResponse = await api.get(
          `/destinations/${tripData.destination_id}`,
        );

        setCatalog(catalogResponse.data.data);
      } else {
        const response = await api.get('/trips');

        setTrips(
          Array.isArray(response.data.data) ? response.data.data : [],
        );
      }
    } catch (requestError: unknown) {
      const requestMessage = axios.isAxiosError(requestError)
        ? requestError.response?.data?.message
        : null;

      setError(requestMessage || 'Saved trips could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredTrips = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return trips.filter((savedTrip) => {
      const matchesStatus =
        statusFilter === 'all' ||
        savedTrip.status.toLowerCase() === statusFilter;

      const matchesSearch =
        !normalizedSearch ||
        savedTrip.title.toLowerCase().includes(normalizedSearch) ||
        savedTrip.destination_name
          .toLowerCase()
          .includes(normalizedSearch) ||
        savedTrip.origin?.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [trips, search, statusFilter]);

  const listSummary = useMemo(() => {
    const totalEstimated = trips.reduce(
      (total, savedTrip) =>
        total + Number(savedTrip.estimated_cost || 0),
      0,
    );

    return {
      total: trips.length,
      planned: trips.filter(
        (savedTrip) => savedTrip.status.toLowerCase() === 'planned',
      ).length,
      drafts: trips.filter(
        (savedTrip) => savedTrip.status.toLowerCase() === 'draft',
      ).length,
      totalEstimated,
    };
  }, [trips]);

  const getStatusClass = (status?: string) => {
    const normalizedStatus = status?.toLowerCase();

    if (normalizedStatus === 'completed') {
      return s.savedTripStatusCompleted;
    }

    if (normalizedStatus === 'cancelled') {
      return s.savedTripStatusCancelled;
    }

    if (normalizedStatus === 'draft') {
      return s.savedTripStatusDraft;
    }

    return s.savedTripStatusPlanned;
  };

  const removeTrip = async () => {
    if (!deleteId) return;

    try {
      setSaving(true);

      await api.delete(`/trips/${deleteId}`);

      setDeleteId(null);

      if (id) {
        navigate('/saved-trips');
      } else {
        await load();
      }
    } catch (requestError: unknown) {
      const requestMessage = axios.isAxiosError(requestError)
        ? requestError.response?.data?.message
        : null;

      setMessage({
        type: 'error',
        text: requestMessage || 'The trip could not be deleted.',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveTripDetails = async () => {
    if (!trip) return;

    try {
      setSaving(true);
      setMessage(null);

      await api.put(`/trips/${trip.id}`, {
        title: trip.title,
        status: trip.status,
        start_date: trip.start_date.slice(0, 10),
        end_date: trip.end_date.slice(0, 10),
        traveller_count: Number(trip.traveller_count),
      });

      await load();

      setMessage({
        type: 'success',
        text: 'Trip details were updated successfully.',
      });
    } catch (requestError: unknown) {
      const requestMessage = axios.isAxiosError(requestError)
        ? requestError.response?.data?.message
        : null;

      setMessage({
        type: 'error',
        text: requestMessage || 'Trip details could not be updated.',
      });
    } finally {
      setSaving(false);
    }
  };

  const replaceHotel = async () => {
    if (!trip || !selectedHotelId) return;

    try {
      setSaving(true);
      setMessage(null);

      await api.put(`/trips/${trip.id}/hotel`, {
        hotelId: Number(selectedHotelId),
      });

      await load();

      setMessage({
        type: 'success',
        text: 'The hotel and trip budget were updated.',
      });
    } catch (requestError: unknown) {
      const requestMessage = axios.isAxiosError(requestError)
        ? requestError.response?.data?.message
        : null;

      setMessage({
        type: 'error',
        text: requestMessage || 'The hotel could not be replaced.',
      });
    } finally {
      setSaving(false);
    }
  };

  const replaceItem = async (item: TripItem) => {
    if (!trip) return;

    const recordId = replacements[item.id];

    if (!recordId) {
      setMessage({
        type: 'error',
        text: 'Choose a replacement before continuing.',
      });

      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      await api.put(
        `/trips/${trip.id}/items/${item.id}/replace`,
        {
          recordId,
        },
      );

      await load();

      setMessage({
        type: 'success',
        text: `${item.item_type} replaced and totals recalculated.`,
      });
    } catch (requestError: unknown) {
      const requestMessage = axios.isAxiosError(requestError)
        ? requestError.response?.data?.message
        : null;

      setMessage({
        type: 'error',
        text:
          requestMessage ||
          `The ${item.item_type} could not be replaced.`,
      });
    } finally {
      setSaving(false);
    }
  };

  const submitItem = async (event: FormEvent) => {
    event.preventDefault();

    if (!trip || !editItem) return;

    try {
      setSaving(true);
      setMessage(null);

      await api.put(
        `/trips/${trip.id}/items/${editItem.id}`,
        editItem,
      );

      setEditItem(null);
      await load();

      setMessage({
        type: 'success',
        text: 'The itinerary item and trip totals were updated.',
      });
    } catch (requestError: unknown) {
      const requestMessage = axios.isAxiosError(requestError)
        ? requestError.response?.data?.message
        : null;

      setMessage({
        type: 'error',
        text:
          requestMessage || 'The itinerary item could not be updated.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (id) {
    if (loading) {
      return (
        <div className={s.savedTripDetailLoading}>
          <div />
          <div />
          <div />
        </div>
      );
    }

    if (error || !trip) {
      return (
        <div className={s.savedTripsErrorState}>
          <span>
            <FaCircleExclamation />
          </span>

          <h1>Trip could not be opened</h1>
          <p>{error || 'This saved trip is unavailable.'}</p>

          <Link to="/saved-trips">
            Return to saved trips
            <FaArrowRight />
          </Link>
        </div>
      );
    }

    const selectedHotel =
      catalog?.hotels?.find(
        (hotel) => hotel.id === Number(selectedHotelId),
      ) || null;

    return (
      <div className={s.savedTripsPage}>
        <Link className={s.savedTripBackLink} to="/saved-trips">
          <FaArrowLeft />
          Back to saved trips
        </Link>

        <section className={s.savedTripDetailHero}>
          <div className={s.savedTripDetailImage}>
            <img
              src={imageUrl(
                trip.destination_image ||
                  selectedHotel?.image ||
                  trip.selected_hotel_image,
              )}
              alt={trip.destination_name}
              onError={(event) => {
                event.currentTarget.src = '/fallback.svg';
              }}
            />

            <div className={s.savedTripDetailOverlay} />
          </div>

          <div className={s.savedTripDetailContent}>
            <span
              className={`${s.savedTripStatus} ${getStatusClass(
                trip.status,
              )}`}
            >
              {getStatusText(trip.status)}
            </span>

            <h1>{trip.title}</h1>

            <p>
              Review the itinerary, update the travel details and
              replace individual recommendations.
            </p>

            <div className={s.savedTripDetailMeta}>
              <span>
                <FaLocationDot />
                {trip.origin || 'Your city'} to{' '}
                {trip.destination_name}
              </span>

              <span>
                <FaCalendarDays />
                {formatDate(trip.start_date)} –{' '}
                {formatDate(trip.end_date)}
              </span>

              <span>
                <FaUsers />
                {trip.traveller_count}{' '}
                {Number(trip.traveller_count) === 1
                  ? 'traveller'
                  : 'travellers'}
              </span>
            </div>
          </div>

          <div className={s.savedTripDetailActions}>
            <button
              type="button"
              onClick={() => setDeleteId(trip.id)}
              disabled={saving}
            >
              <FaTrash />
              Delete trip
            </button>
          </div>
        </section>

        {message && (
          <div
            className={`${s.savedTripMessage} ${
              message.type === 'error'
                ? s.savedTripMessageError
                : s.savedTripMessageSuccess
            }`}
          >
            {message.type === 'error' ? (
              <FaCircleExclamation />
            ) : (
              <FaCircleCheck />
            )}

            <span>{message.text}</span>

            <button
              type="button"
              aria-label="Close message"
              onClick={() => setMessage(null)}
            >
              <FaXmark />
            </button>
          </div>
        )}

        <section className={s.savedTripSummaryGrid}>
          <article>
            <span>
              <FaWallet />
            </span>

            <div>
              <small>Total budget</small>
              <strong>{formatMoney(trip.total_budget)}</strong>
              <p>Maximum planned amount</p>
            </div>
          </article>

          <article>
            <span>
              <FaIndianRupeeSign />
            </span>

            <div>
              <small>Estimated cost</small>
              <strong>{formatMoney(trip.estimated_cost)}</strong>
              <p>Current itinerary total</p>
            </div>
          </article>

          <article>
            <span>
              <FaCircleCheck />
            </span>

            <div>
              <small>Remaining budget</small>
              <strong>
                {formatMoney(trip.remaining_budget)}
              </strong>
              <p>Available after estimated costs</p>
            </div>
          </article>

          <article>
            <span>
              <FaRoute />
            </span>

            <div>
              <small>Trip duration</small>
              <strong>
                {calculateDuration(
                  trip.start_date,
                  trip.end_date,
                )}{' '}
                days
              </strong>
              <p>{trip.days?.length || 0} itinerary days</p>
            </div>
          </article>
        </section>

        <section className={s.savedTripEditorGrid}>
          <article className={s.savedTripPanel}>
            <div className={s.savedTripPanelHeader}>
              <div>
                <span className={s.savedTripsEyebrow}>
                  Trip information
                </span>

                <h2>Edit the main details</h2>

                <p>
                  Update the title, dates, travellers and current
                  status.
                </p>
              </div>

              <span>
                <FaPen />
              </span>
            </div>

            <div className={s.savedTripFormGrid}>
              <label
                className={`${s.savedTripField} ${s.savedTripFieldFull}`}
              >
                <span>Trip title</span>

                <input
                  value={trip.title}
                  onChange={(event) =>
                    setTrip({
                      ...trip,
                      title: event.target.value,
                    })
                  }
                />
              </label>

              <label className={s.savedTripField}>
                <span>Status</span>

                <select
                  value={trip.status}
                  onChange={(event) =>
                    setTrip({
                      ...trip,
                      status: event.target.value,
                    })
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="planned">Planned</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>

              <label className={s.savedTripField}>
                <span>Travellers</span>

                <input
                  type="number"
                  min="1"
                  max="30"
                  value={trip.traveller_count}
                  onChange={(event) =>
                    setTrip({
                      ...trip,
                      traveller_count: event.target.valueAsNumber,
                    })
                  }
                />
              </label>

              <label className={s.savedTripField}>
                <span>Start date</span>

                <input
                  type="date"
                  value={trip.start_date.slice(0, 10)}
                  onChange={(event) =>
                    setTrip({
                      ...trip,
                      start_date: event.target.value,
                    })
                  }
                />
              </label>

              <label className={s.savedTripField}>
                <span>End date</span>

                <input
                  type="date"
                  value={trip.end_date.slice(0, 10)}
                  onChange={(event) =>
                    setTrip({
                      ...trip,
                      end_date: event.target.value,
                    })
                  }
                />
              </label>
            </div>

            <button
              type="button"
              className={s.savedTripSaveButton}
              onClick={saveTripDetails}
              disabled={saving}
            >
              <FaCircleCheck />
              {saving ? 'Saving changes...' : 'Save trip details'}
            </button>
          </article>

          <article className={s.savedTripHotelPanel}>
            <div className={s.savedTripPanelHeader}>
              <div>
                <span className={s.savedTripsEyebrow}>
                  Accommodation
                </span>

                <h2>Selected hotel</h2>
              </div>

              <span>
                <FaHotel />
              </span>
            </div>

            <div className={s.savedTripHotelHero}>
              <img
                src={imageUrl(
                  trip.selected_hotel_image ||
                    selectedHotel?.image,
                )}
                alt={trip.selected_hotel_name || 'Selected hotel'}
                onError={(event) => {
                  event.currentTarget.src = '/fallback.svg';
                }}
              />

              <div>
                <span>{trip.selected_hotel_room_type}</span>

                <h3>
                  {trip.selected_hotel_name ||
                    selectedHotel?.name ||
                    'No hotel selected'}
                </h3>

                <p>
                  <FaLocationDot />
                  {trip.selected_hotel_location ||
                    selectedHotel?.location ||
                    trip.destination_name}
                </p>

                <strong>
                  {formatMoney(
                    trip.selected_hotel_price ||
                      selectedHotel?.price_per_night,
                  )}
                  <small>/night</small>
                </strong>
              </div>
            </div>

            {catalog?.hotels?.length ? (
              <div className={s.savedTripHotelReplace}>
                <label>
                  <span>Choose another hotel</span>

                  <select
                    value={selectedHotelId}
                    onChange={(event) =>
                      setSelectedHotelId(event.target.value)
                    }
                  >
                    <option value="">Select a hotel</option>

                    {catalog.hotels.map((hotel) => (
                      <option value={hotel.id} key={hotel.id}>
                        {hotel.name} ·{' '}
                        {formatMoney(hotel.price_per_night)}/night
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={replaceHotel}
                  disabled={saving || !selectedHotelId}
                >
                  Replace hotel
                  <FaArrowRight />
                </button>
              </div>
            ) : (
              <p className={s.savedTripUnavailableText}>
                No alternative hotels are currently available.
              </p>
            )}
          </article>
        </section>

        <section className={s.savedTripDaysSection}>
          <div className={s.savedTripSectionHeading}>
            <div>
              <span className={s.savedTripsEyebrow}>
                Day-wise itinerary
              </span>

              <h2>Edit your saved travel schedule</h2>

              <p>
                Adjust timing, costs, notes and individual travel
                recommendations.
              </p>
            </div>

            <span>
              {trip.days?.length || 0}{' '}
              {trip.days?.length === 1 ? 'day' : 'days'}
            </span>
          </div>

          <div className={s.savedTripDayList}>
            {(trip.days || []).map((day) => (
              <article
                className={s.savedTripDayCard}
                key={day.id}
              >
                <header className={s.savedTripDayHeader}>
                  <span className={s.savedTripDayNumber}>
                    <small>Day</small>
                    <strong>{day.day_number}</strong>
                  </span>

                  <div className={s.savedTripDayTitle}>
                    <span>{formatDate(day.trip_date)}</span>
                    <h3>{day.title}</h3>

                    <p>
                      {day.items.length}{' '}
                      {day.items.length === 1
                        ? 'planned item'
                        : 'planned items'}
                    </p>
                  </div>

                  <div className={s.savedTripDayTotal}>
                    <small>Daily estimate</small>
                    <strong>{formatMoney(day.daily_total)}</strong>
                  </div>
                </header>

                <div className={s.savedTripTimeline}>
                  {day.items.map((item, itemIndex) => {
                    const replacementOptions =
                      item.item_type === 'restaurant'
                        ? catalog?.restaurants || []
                        : item.item_type === 'attraction'
                          ? catalog?.attractions || []
                          : [];

                    return (
                      <div
                        className={s.savedTripTimelineItem}
                        key={item.id}
                      >
                        <div className={s.savedTripTimelineTime}>
                          <strong>
                            {item.start_time?.slice(0, 5) || '—'}
                          </strong>

                          <small>
                            {item.end_time?.slice(0, 5) || '—'}
                          </small>
                        </div>

                        <div className={s.savedTripTimelineMarker}>
                          <span />

                          {itemIndex < day.items.length - 1 && (
                            <i />
                          )}
                        </div>

                        <div
                          className={s.savedTripTimelineContent}
                        >
                          <div className={s.savedTripItemTop}>
                            <div>
                              <span
                                className={s.savedTripItemType}
                              >
                                {item.item_type}
                              </span>

                              {Number(item.travel_minutes) > 0 && (
                                <span
                                  className={s.savedTripTravelTime}
                                >
                                  <FaRoute />
                                  {item.travel_minutes} min
                                </span>
                              )}
                            </div>

                            <strong>
                              {Number(item.estimated_cost) === 0
                                ? 'Free'
                                : formatMoney(
                                    item.estimated_cost,
                                  )}
                            </strong>
                          </div>

                          <h4>{item.title}</h4>

                          <div className={s.savedTripItemMeta}>
                            <span>
                              <FaLocationDot />
                              {item.location ||
                                trip.destination_name}
                            </span>

                            <span>
                              <FaClock />
                              {item.start_time?.slice(0, 5)} –{' '}
                              {item.end_time?.slice(0, 5)}
                            </span>
                          </div>

                          {item.notes && <p>{item.notes}</p>}

                          {replacementOptions.length > 0 && (
                            <div
                              className={s.savedTripReplaceRow}
                            >
                              <select
                                value={
                                  replacements[item.id] ||
                                  item.related_record_id ||
                                  ''
                                }
                                onChange={(event) =>
                                  setReplacements({
                                    ...replacements,
                                    [item.id]: Number(
                                      event.target.value,
                                    ),
                                  })
                                }
                              >
                                <option value="">
                                  Choose replacement
                                </option>

                                {replacementOptions.map(
                                  (record) => (
                                    <option
                                      value={record.id}
                                      key={record.id}
                                    >
                                      {record.name} ·{' '}
                                      {formatMoney(
                                        item.item_type ===
                                          'restaurant'
                                          ? 'average_cost_per_person' in
                                              record
                                            ? record.average_cost_per_person
                                            : 0
                                          : 'entry_fee' in record
                                            ? record.entry_fee
                                            : 0,
                                      )}
                                    </option>
                                  ),
                                )}
                              </select>

                              <button
                                type="button"
                                onClick={() => replaceItem(item)}
                                disabled={saving}
                              >
                                Replace
                              </button>
                            </div>
                          )}
                        </div>

                        <div className={s.savedTripItemActions}>
                          <button
                            type="button"
                            onClick={() =>
                              setEditItem({
                                id: item.id,
                                title: item.title,
                                location: item.location || '',
                                start_time:
                                  item.start_time?.slice(0, 5) ||
                                  '',
                                end_time:
                                  item.end_time?.slice(0, 5) || '',
                                travel_minutes: Number(
                                  item.travel_minutes || 0,
                                ),
                                estimated_cost: Number(
                                  item.estimated_cost || 0,
                                ),
                                notes: item.notes || '',
                              })
                            }
                          >
                            <FaPen />
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>

        {editItem && (
          <div className={s.savedTripModalBackdrop}>
            <form
              className={s.savedTripModal}
              onSubmit={submitItem}
            >
              <header className={s.savedTripModalHeader}>
                <div>
                  <span className={s.savedTripsEyebrow}>
                    Itinerary editor
                  </span>

                  <h2>Edit itinerary item</h2>

                  <p>
                    Changes will update the trip and recalculate its
                    totals.
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close editor"
                  onClick={() => setEditItem(null)}
                >
                  <FaXmark />
                </button>
              </header>

              <div className={s.savedTripFormGrid}>
                <label
                  className={`${s.savedTripField} ${s.savedTripFieldFull}`}
                >
                  <span>Title</span>

                  <input
                    value={editItem.title}
                    onChange={(event) =>
                      setEditItem({
                        ...editItem,
                        title: event.target.value,
                      })
                    }
                  />
                </label>

                <label
                  className={`${s.savedTripField} ${s.savedTripFieldFull}`}
                >
                  <span>Location</span>

                  <input
                    value={editItem.location}
                    onChange={(event) =>
                      setEditItem({
                        ...editItem,
                        location: event.target.value,
                      })
                    }
                  />
                </label>

                <label className={s.savedTripField}>
                  <span>Start time</span>

                  <input
                    type="time"
                    value={editItem.start_time}
                    onChange={(event) =>
                      setEditItem({
                        ...editItem,
                        start_time: event.target.value,
                      })
                    }
                  />
                </label>

                <label className={s.savedTripField}>
                  <span>End time</span>

                  <input
                    type="time"
                    value={editItem.end_time}
                    onChange={(event) =>
                      setEditItem({
                        ...editItem,
                        end_time: event.target.value,
                      })
                    }
                  />
                </label>

                <label className={s.savedTripField}>
                  <span>Travel minutes</span>

                  <input
                    type="number"
                    min="0"
                    value={editItem.travel_minutes}
                    onChange={(event) =>
                      setEditItem({
                        ...editItem,
                        travel_minutes:
                          event.target.valueAsNumber || 0,
                      })
                    }
                  />
                </label>

                <label className={s.savedTripField}>
                  <span>Estimated cost</span>

                  <input
                    type="number"
                    min="0"
                    value={editItem.estimated_cost}
                    onChange={(event) =>
                      setEditItem({
                        ...editItem,
                        estimated_cost:
                          event.target.valueAsNumber || 0,
                      })
                    }
                  />
                </label>

                <label
                  className={`${s.savedTripField} ${s.savedTripFieldFull}`}
                >
                  <span>Notes</span>

                  <textarea
                    rows={4}
                    value={editItem.notes}
                    onChange={(event) =>
                      setEditItem({
                        ...editItem,
                        notes: event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <footer className={s.savedTripModalActions}>
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                >
                  Cancel
                </button>

                <button type="submit" disabled={saving}>
                  <FaCircleCheck />
                  {saving
                    ? 'Saving changes...'
                    : 'Save and recalculate'}
                </button>
              </footer>
            </form>
          </div>
        )}

        {deleteId && (
          <ConfirmModal
            title="Delete saved trip?"
            body="This permanently removes the trip, itinerary days, items and budget information."
            onClose={() => setDeleteId(null)}
            onConfirm={removeTrip}
          />
        )}
      </div>
    );
  }

  return (
    <div className={s.savedTripsPage}>
      <section className={s.savedTripsHero}>
        <div className={s.savedTripsHeroContent}>
          <span className={s.savedTripsEyebrow}>
            Your travel library
          </span>

          <h1>Saved journeys, ready whenever you are.</h1>

          <p>
            Reopen your itineraries, update the budget, change hotels
            and continue planning every part of your trip.
          </p>

          <Link
            className={s.savedTripsPrimaryButton}
            to="/plan-trip"
          >
            <FaPlus />
            Plan a new trip
            <FaArrowRight />
          </Link>
        </div>

        <div className={s.savedTripsHeroAside}>
          <span>
            <FaMapLocationDot />
          </span>

          <div>
            <small>Your saved collection</small>
            <strong>{loading ? '—' : listSummary.total}</strong>
            <p>Complete and editable itineraries</p>
          </div>
        </div>
      </section>

      {error && (
        <div className={s.savedTripMessageError}>
          <FaCircleExclamation />
          <span>{error}</span>

          <button type="button" onClick={() => void load()}>
            Try again
          </button>
        </div>
      )}

      <section className={s.savedTripsMetrics}>
        <article>
          <span>
            <FaCompass />
          </span>

          <div>
            <small>All saved trips</small>
            <strong>{loading ? '—' : listSummary.total}</strong>
            <p>Your complete travel library</p>
          </div>
        </article>

        <article>
          <span>
            <FaCalendarDays />
          </span>

          <div>
            <small>Planned journeys</small>
            <strong>{loading ? '—' : listSummary.planned}</strong>
            <p>Trips waiting to begin</p>
          </div>
        </article>

        <article>
          <span>
            <FaPen />
          </span>

          <div>
            <small>Draft itineraries</small>
            <strong>{loading ? '—' : listSummary.drafts}</strong>
            <p>Plans still being edited</p>
          </div>
        </article>

        <article>
          <span>
            <FaIndianRupeeSign />
          </span>

          <div>
            <small>Total estimated</small>
            <strong>
              {loading
                ? '—'
                : formatMoney(listSummary.totalEstimated)}
            </strong>
            <p>Across every saved trip</p>
          </div>
        </article>
      </section>

      <section className={s.savedTripsToolbar}>
        <div className={s.savedTripsToolbarHeading}>
          <span>
            <FaSliders />
          </span>

          <div>
            <h2>Find a saved trip</h2>
            <p>Search by trip title, destination or starting city.</p>
          </div>
        </div>

        <div className={s.savedTripsFilters}>
          <label className={s.savedTripsSearch}>
            <FaMagnifyingGlass />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search your trips"
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

          <label className={s.savedTripsSelect}>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft trips</option>
              <option value="planned">Planned trips</option>
              <option value="completed">Completed trips</option>
              <option value="cancelled">Cancelled trips</option>
            </select>
          </label>
        </div>
      </section>

      <div className={s.savedTripsResultsHeader}>
        <div>
          <strong>
            {loading
              ? 'Loading trips...'
              : `${filteredTrips.length} ${
                  filteredTrips.length === 1 ? 'trip' : 'trips'
                } shown`}
          </strong>

          <span>
            Open any itinerary to edit its details and schedule.
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
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className={s.savedTripsGrid}>
          {[1, 2, 3, 4].map((item) => (
            <div
              className={s.savedTripsSkeleton}
              key={item}
            />
          ))}
        </div>
      ) : filteredTrips.length > 0 ? (
        <div className={s.savedTripsGrid}>
          {filteredTrips.map((savedTrip) => (
            <article
              className={s.savedTripCard}
              key={savedTrip.id}
            >
              <div className={s.savedTripCardImage}>
                <img
                  src={imageUrl(savedTrip.destination_image)}
                  alt={savedTrip.destination_name}
                  onError={(event) => {
                    event.currentTarget.src = '/fallback.svg';
                  }}
                />

                <span
                  className={`${s.savedTripStatus} ${getStatusClass(
                    savedTrip.status,
                  )}`}
                >
                  {getStatusText(savedTrip.status)}
                </span>
              </div>

              <div className={s.savedTripCardBody}>
                <span className={s.savedTripLocation}>
                  <FaLocationDot />
                  {savedTrip.destination_name}
                </span>

                <h2>{savedTrip.title}</h2>

                <p>
                  {savedTrip.origin
                    ? `${savedTrip.origin} to ${savedTrip.destination_name}`
                    : `Journey to ${savedTrip.destination_name}`}
                </p>

                <div className={s.savedTripCardMeta}>
                  <span>
                    <FaCalendarDays />
                    <small>Travel dates</small>
                    <strong>
                      {formatDate(savedTrip.start_date)}
                    </strong>
                  </span>

                  <span>
                    <FaRoute />
                    <small>Duration</small>
                    <strong>
                      {calculateDuration(
                        savedTrip.start_date,
                        savedTrip.end_date,
                      )}{' '}
                      days
                    </strong>
                  </span>

                  <span>
                    <FaUsers />
                    <small>Travellers</small>
                    <strong>{savedTrip.traveller_count}</strong>
                  </span>
                </div>

                <footer className={s.savedTripCardFooter}>
                  <div>
                    <small>Estimated trip cost</small>
                    <strong>
                      {formatMoney(savedTrip.estimated_cost)}
                    </strong>
                  </div>

                  <div>
                    <Link
                      to={`/saved-trips/${savedTrip.id}`}
                      className={s.savedTripOpenButton}
                    >
                      Open itinerary
                      <FaArrowRight />
                    </Link>

                    <button
                      type="button"
                      className={s.savedTripDeleteButton}
                      aria-label={`Delete ${savedTrip.title}`}
                      onClick={() => setDeleteId(savedTrip.id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </footer>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={s.savedTripsEmpty}>
          <span>
            <FaMapLocationDot />
          </span>

          <h2>
            {trips.length === 0
              ? 'No saved journeys yet'
              : 'No matching trips'}
          </h2>

          <p>
            {trips.length === 0
              ? 'Create your first itinerary and save it to access it from this page.'
              : 'Try another search term or remove the selected status filter.'}
          </p>

          {trips.length === 0 ? (
            <Link to="/plan-trip">
              Plan my first trip
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
              Reset filters
            </button>
          )}
        </div>
      )}

      {deleteId && (
        <ConfirmModal
          title="Delete saved trip?"
          body="This action permanently removes the selected itinerary and cannot be undone."
          onClose={() => setDeleteId(null)}
          onConfirm={removeTrip}
        />
      )}
    </div>
  );
}