import { useMemo, useState } from 'react';
import axios from 'axios';
import {
  FaArrowLeft,
  FaArrowRight,
  FaBed,
  FaCalendarDays,
  FaCheck,
  FaCircleCheck,
  FaCircleExclamation,
  FaClock,
  FaCompass,
  FaHotel,
  FaIndianRupeeSign,
  FaLocationDot,
  FaRotate,
  FaRoute,
  FaStar,
  FaUtensils,
  FaWallet,
  FaWandMagicSparkles,
} from 'react-icons/fa6';
import { Link, useNavigate } from 'react-router-dom';

import api, { imageUrl } from '../api/client';
import type { Plan } from '../types';
import s from '../components/ui.module.css';

type MessageState = {
  type: 'success' | 'error';
  text: string;
} | null;

type ActiveAction = 'save' | 'regenerate' | `day-${number}` | null;

const money = (value: unknown) =>
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

const formatShortDate = (value?: string) => {
  if (!value) return '';

  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
};

const toMinutes = (time?: string) => {
  if (!time) return 0;

  const [hours, minutes] = time.split(':').map(Number);

  return hours * 60 + minutes;
};

const getDurationText = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) return '';

  const difference = toMinutes(endTime) - toMinutes(startTime);

  if (difference <= 0) return '';

  const hours = Math.floor(difference / 60);
  const minutes = difference % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours} hr ${minutes} min`;
  }

  if (hours > 0) {
    return `${hours} hr`;
  }

  return `${minutes} min`;
};

const uniqueValues = (values: Array<string | undefined>) =>
  [...new Set(values.filter(Boolean))].join(',');

export default function Itinerary() {
  const navigate = useNavigate();

  const [plan, setPlan] = useState<Plan | null>(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem('tripgenie_plan') || 'null',
      );
    } catch {
      return null;
    }
  });

  const [activeAction, setActiveAction] =
    useState<ActiveAction>(null);

  const [message, setMessage] =
    useState<MessageState>(null);

  const budget = useMemo(() => {
    if (!plan) {
      return {
        planned: 0,
        total: 0,
        remaining: 0,
        percentageUsed: 0,
        accommodation: 0,
        food: 0,
        attractions: 0,
        transport: 0,
        activities: 0,
        miscellaneous: 0,
        contingency: 0,
        perPerson: 0,
        perDay: 0,
        overBudget: false,
        overBy: 0,
      };
    }

    return {
      planned: Number(plan.budget.planned || 0),
      total: Number(plan.budget.total || 0),
      remaining: Number(plan.budget.remaining || 0),
      percentageUsed: Number(plan.budget.percentageUsed || 0),
      accommodation: Number(plan.budget.accommodation || 0),
      food: Number(plan.budget.food || 0),
      attractions: Number(plan.budget.attractions || 0),
      transport: Number(plan.budget.transport || 0),
      activities: Number(plan.budget.activities || 0),
      miscellaneous: Number(plan.budget.miscellaneous || 0),
      contingency: Number(plan.budget.contingency || 0),
      perPerson: Number(plan.budget.perPerson || 0),
      perDay: Number(plan.budget.perDay || 0),
      overBudget: Boolean(plan.budget.overBudget),
      overBy: Number(plan.budget.overBy || 0),
    };
  }, [plan]);

  const preferencePayload = useMemo(() => {
    if (!plan) {
      return {
        interests: 'Nature,Culture',
        cuisines: 'Indian,Local',
        dietaryRequirements: 'Mixed menu',
      };
    }

    return {
      interests:
        uniqueValues(
          plan.attractions.map((attraction) => attraction.category),
        ) || 'Nature,Culture',

      cuisines:
        uniqueValues(
          plan.restaurants.map((restaurant) => restaurant.cuisine),
        ) || 'Indian,Local',

      dietaryRequirements:
        uniqueValues(
          plan.restaurants.map(
            (restaurant) => restaurant.dietary_options,
          ),
        ) || 'Mixed menu',
    };
  }, [plan]);

  if (!plan) {
    return (
      <div className={s.itineraryEmptyPage}>
        <div className={s.itineraryEmptyCard}>
          <span>
            <FaRoute />
          </span>

          <h1>No itinerary generated yet</h1>

          <p>
            Complete the trip-planning wizard to create your
            personalized day-wise itinerary.
          </p>

          <Link to="/plan-trip">
            Plan a new trip
            <FaArrowRight />
          </Link>
        </div>
      </div>
    );
  }

  const savePlanLocally = (updatedPlan: Plan) => {
    setPlan(updatedPlan);

    sessionStorage.setItem(
      'tripgenie_plan',
      JSON.stringify(updatedPlan),
    );
  };

  const saveTrip = async () => {
    setActiveAction('save');
    setMessage(null);

    try {
      await api.post('/trips', plan);

      setMessage({
        type: 'success',
        text: 'Your itinerary was saved successfully.',
      });

      window.setTimeout(() => {
        navigate('/saved-trips');
      }, 900);
    } catch (requestError: unknown) {
      const text = axios.isAxiosError(requestError)
        ? requestError.response?.data?.message
        : null;

      setMessage({
        type: 'error',
        text: text || 'The itinerary could not be saved.',
      });
    } finally {
      setActiveAction(null);
    }
  };

  const regenerateItinerary = async () => {
    setActiveAction('regenerate');
    setMessage(null);

    try {
      const response = await api.post(
        '/ai/generate-itinerary',
        {
          origin: plan.origin,
          destinationId: plan.destination.id,
          totalBudget: budget.planned,
          travellers: plan.travellers,
          days: plan.days,
          startDate: plan.startDate,
          endDate: plan.endDate,
          interests: preferencePayload.interests,
          cuisines: preferencePayload.cuisines,
          dietaryRequirements:
            preferencePayload.dietaryRequirements,
          hotelPreference:
            plan.hotel.hotel_type || 'budget',
          transportPreference: 'mixed',
          travelStyle: 'balanced',
          contingencyPercent:
            budget.planned > 0
              ? Math.round(
                  (budget.contingency / budget.planned) * 100,
                )
              : 5,
          miscellaneous: budget.miscellaneous,
        },
      );

      savePlanLocally(response.data.data);

      setMessage({
        type: 'success',
        text: 'The complete itinerary was regenerated.',
      });
    } catch (requestError: unknown) {
      const text = axios.isAxiosError(requestError)
        ? requestError.response?.data?.message
        : null;

      setMessage({
        type: 'error',
        text: text || 'The itinerary could not be regenerated.',
      });
    } finally {
      setActiveAction(null);
    }
  };

  const regenerateDay = async (
    dayNumber: number,
    date: string,
  ) => {
    setActiveAction(`day-${dayNumber}`);
    setMessage(null);

    try {
      const response = await api.post('/ai/regenerate-day', {
        origin: plan.origin,
        destinationId: plan.destination.id,
        totalBudget: budget.planned / Math.max(plan.days, 1),
        travellers: plan.travellers,
        days: 1,
        startDate: date,
        endDate: date,
        date,
        dayNumber,
        interests: preferencePayload.interests,
        cuisines: preferencePayload.cuisines,
        dietaryRequirements:
          preferencePayload.dietaryRequirements,
        hotelPreference:
          plan.hotel.hotel_type || 'budget',
        transportPreference: 'mixed',
        travelStyle: 'balanced',
      });

      const updatedPlan: Plan = {
        ...plan,
        itinerary: plan.itinerary.map((day) =>
          day.dayNumber === dayNumber
            ? {
                ...response.data.data,
                dayNumber,
                date,
              }
            : day,
        ),
      };

      savePlanLocally(updatedPlan);

      setMessage({
        type: 'success',
        text: `Day ${dayNumber} was regenerated successfully.`,
      });
    } catch (requestError: unknown) {
      const text = axios.isAxiosError(requestError)
        ? requestError.response?.data?.message
        : null;

      setMessage({
        type: 'error',
        text: text || `Day ${dayNumber} could not be regenerated.`,
      });
    } finally {
      setActiveAction(null);
    }
  };

  const sourceLabel =
    plan.ai.source === 'groq'
      ? 'AI-assisted recommendation'
      : 'Smart travel recommendation';

  return (
    <div className={s.itineraryPage}>
      <Link
        className={s.itineraryBackLink}
        to="/plan-trip"
      >
        <FaArrowLeft />
        Back to trip planner
      </Link>

      <section className={s.itineraryHero}>
        <div className={s.itineraryHeroImage}>
          <img
            src={imageUrl(plan.destination.image)}
            alt={plan.destination.name}
            onError={(event) => {
              event.currentTarget.src = '/fallback.svg';
            }}
          />

          <div className={s.itineraryHeroOverlay} />
        </div>

        <div className={s.itineraryHeroContent}>
          <span className={s.itineraryEyebrow}>
            <FaWandMagicSparkles />
            {sourceLabel}
          </span>

          <h1>{plan.title}</h1>

          <p>
            A complete {plan.days}-day journey from {plan.origin} to{' '}
            {plan.destination.name}, designed for{' '}
            {plan.travellers}{' '}
            {plan.travellers === 1
              ? 'traveller'
              : 'travellers'}.
          </p>

          <div className={s.itineraryHeroMeta}>
            <span>
              <FaLocationDot />
              {plan.destination.city},{' '}
              {plan.destination.state}
            </span>

            <span>
              <FaCalendarDays />
              {formatDate(plan.startDate)} –{' '}
              {formatDate(plan.endDate)}
            </span>

            <span>
              <FaRoute />
              {plan.days} {plan.days === 1 ? 'day' : 'days'}
            </span>
          </div>

          <div className={s.itineraryHeroActions}>
            <button
              type="button"
              className={s.itinerarySecondaryButton}
              onClick={regenerateItinerary}
              disabled={activeAction !== null}
            >
              <FaRotate />

              {activeAction === 'regenerate'
                ? 'Regenerating...'
                : 'Regenerate plan'}
            </button>

            <button
              type="button"
              className={s.itineraryPrimaryButton}
              onClick={saveTrip}
              disabled={activeAction !== null}
            >
              <FaCheck />

              {activeAction === 'save'
                ? 'Saving...'
                : 'Save itinerary'}
            </button>
          </div>
        </div>

        <aside className={s.itineraryHeroBudget}>
          <span>Total estimated cost</span>

          <strong>{money(budget.total)}</strong>

          <small>
            of {money(budget.planned)} planned
          </small>

          <div className={s.itineraryHeroProgress}>
            <span
              style={{
                width: `${Math.min(
                  Math.max(budget.percentageUsed, 0),
                  100,
                )}%`,
              }}
            />
          </div>

          <div>
            <span>Budget used</span>
            <strong>{Math.round(budget.percentageUsed)}%</strong>
          </div>
        </aside>
      </section>

      {message && (
        <div
          className={`${s.itineraryMessage} ${
            message.type === 'error'
              ? s.itineraryMessageError
              : s.itineraryMessageSuccess
          }`}
          role="alert"
        >
          {message.type === 'error' ? (
            <FaCircleExclamation />
          ) : (
            <FaCircleCheck />
          )}

          <span>{message.text}</span>
        </div>
      )}

      <section className={s.itineraryMetrics}>
        <article>
          <span>
            <FaWallet />
          </span>

          <div>
            <small>Planned budget</small>
            <strong>{money(budget.planned)}</strong>
            <p>Your maximum trip amount</p>
          </div>
        </article>

        <article>
          <span>
            <FaIndianRupeeSign />
          </span>

          <div>
            <small>Estimated total</small>
            <strong>{money(budget.total)}</strong>
            <p>Current itinerary estimate</p>
          </div>
        </article>

        <article>
          <span>
            <FaCircleCheck />
          </span>

          <div>
            <small>
              {budget.remaining >= 0
                ? 'Remaining budget'
                : 'Amount over budget'}
            </small>

            <strong
              className={
                budget.remaining < 0
                  ? s.itineraryNegative
                  : s.itineraryPositive
              }
            >
              {money(Math.abs(budget.remaining))}
            </strong>

            <p>
              {budget.remaining >= 0
                ? 'Available after planned costs'
                : 'Consider lower-cost alternatives'}
            </p>
          </div>
        </article>

        <article>
          <span>
            <FaCalendarDays />
          </span>

          <div>
            <small>Average per day</small>
            <strong>{money(budget.perDay)}</strong>
            <p>{money(budget.perPerson)} per traveller</p>
          </div>
        </article>
      </section>

      {budget.overBudget && (
        <section className={s.itineraryBudgetAlert}>
          <span>
            <FaCircleExclamation />
          </span>

          <div>
            <strong>
              This itinerary is {money(budget.overBy)} over budget
            </strong>

            <p>
              Regenerate the plan or replace premium hotels and paid
              attractions with more affordable alternatives.
            </p>
          </div>

          <button
            type="button"
            onClick={regenerateItinerary}
            disabled={activeAction !== null}
          >
            Find cheaper options
            <FaArrowRight />
          </button>
        </section>
      )}

      <section className={s.itineraryOverviewGrid}>
        <article className={s.itineraryBudgetCard}>
          <div className={s.itinerarySectionHeading}>
            <div>
              <span className={s.itineraryEyebrow}>
                Budget breakdown
              </span>

              <h2>Where your money goes</h2>
            </div>

            <span className={s.itineraryHeadingIcon}>
              <FaWallet />
            </span>
          </div>

          <div className={s.itineraryBudgetBar}>
            <span
              style={{
                width: `${Math.min(
                  Math.max(budget.percentageUsed, 0),
                  100,
                )}%`,
              }}
            />
          </div>

          <div className={s.itineraryBudgetLegend}>
            <span>
              <i className={s.itineraryLegendAccommodation} />
              Accommodation
            </span>

            <span>
              <i className={s.itineraryLegendFood} />
              Food
            </span>

            <span>
              <i className={s.itineraryLegendTransport} />
              Transport
            </span>

            <span>
              <i className={s.itineraryLegendAttractions} />
              Experiences
            </span>
          </div>

          <div className={s.itineraryBudgetRows}>
            <div>
              <span>
                <FaHotel />
                Accommodation
              </span>
              <strong>{money(budget.accommodation)}</strong>
            </div>

            <div>
              <span>
                <FaUtensils />
                Food and restaurants
              </span>
              <strong>{money(budget.food)}</strong>
            </div>

            <div>
              <span>
                <FaRoute />
                Transportation
              </span>
              <strong>{money(budget.transport)}</strong>
            </div>

            <div>
              <span>
                <FaCompass />
                Attractions
              </span>
              <strong>{money(budget.attractions)}</strong>
            </div>

            {budget.activities > 0 && (
              <div>
                <span>
                  <FaWandMagicSparkles />
                  Other activities
                </span>
                <strong>{money(budget.activities)}</strong>
              </div>
            )}

            <div>
              <span>
                <FaWallet />
                Miscellaneous
              </span>
              <strong>{money(budget.miscellaneous)}</strong>
            </div>

            <div>
              <span>
                <FaCircleCheck />
                Contingency reserve
              </span>
              <strong>{money(budget.contingency)}</strong>
            </div>
          </div>
        </article>

        <article className={s.itineraryHotelCard}>
          <div className={s.itineraryHotelImage}>
            <img
              src={imageUrl(plan.hotel.image)}
              alt={plan.hotel.name}
              onError={(event) => {
                event.currentTarget.src = '/fallback.svg';
              }}
            />

            <span>
              <FaStar />
              {Number(plan.hotel.rating || 0).toFixed(1)}
            </span>
          </div>

          <div className={s.itineraryHotelBody}>
            <span className={s.itineraryEyebrow}>
              Selected accommodation
            </span>

            <h2>{plan.hotel.name}</h2>

            <p className={s.itineraryHotelLocation}>
              <FaLocationDot />
              {plan.hotel.location}
            </p>

            <p>{plan.hotel.description}</p>

            <div className={s.itineraryHotelFacts}>
              <div>
                <small>Room type</small>
                <strong>{plan.hotel.room_type}</strong>
              </div>

              <div>
                <small>Hotel category</small>
                <strong>{plan.hotel.hotel_type}</strong>
              </div>

              <div>
                <small>Maximum guests</small>
                <strong>{plan.hotel.maximum_guests}</strong>
              </div>
            </div>

            <div className={s.itineraryHotelFooter}>
              <div>
                <small>Price per night</small>
                <strong>
                  {money(plan.hotel.price_per_night)}
                </strong>
              </div>

              <span>
                <FaBed />
                {plan.days > 1 ? plan.days - 1 : 1}{' '}
                {plan.days > 2 ? 'nights' : 'night'}
              </span>
            </div>
          </div>
        </article>
      </section>

      <section className={s.itineraryExplanation}>
        <div className={s.itineraryExplanationIcon}>
          <FaWandMagicSparkles />
        </div>

        <div>
          <span className={s.itineraryEyebrow}>
            Why this plan fits
          </span>

          <h2>A journey designed around your request</h2>

          <p>{plan.ai.explanation}</p>
        </div>
      </section>

      <section className={s.itineraryDaysSection}>
        <div className={s.itineraryMainHeading}>
          <div>
            <span className={s.itineraryEyebrow}>
              Day-wise itinerary
            </span>

            <h2>Your complete travel schedule</h2>

            <p>
              Review each day, activity, meal, transfer time and
              estimated cost.
            </p>
          </div>

          <span>
            {plan.itinerary.length}{' '}
            {plan.itinerary.length === 1 ? 'day' : 'days'}
          </span>
        </div>

        <div className={s.itineraryDayList}>
          {plan.itinerary.map((day) => {
            const dailyTotal = day.items.reduce(
              (total, item) =>
                total + Number(item.itemCost || 0),
              0,
            );

            return (
              <article
                className={s.itineraryDayCard}
                key={day.dayNumber}
              >
                <header className={s.itineraryDayHeader}>
                  <div className={s.itineraryDayNumber}>
                    <small>Day</small>
                    <strong>{day.dayNumber}</strong>
                  </div>

                  <div className={s.itineraryDayTitle}>
                    <span>{formatShortDate(day.date)}</span>
                    <h3>{day.title}</h3>

                    <p>
                      {day.items.length}{' '}
                      {day.items.length === 1
                        ? 'planned stop'
                        : 'planned stops'}
                    </p>
                  </div>

                  <div className={s.itineraryDayHeaderActions}>
                    <div>
                      <small>Daily estimate</small>
                      <strong>{money(dailyTotal)}</strong>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        regenerateDay(day.dayNumber, day.date)
                      }
                      disabled={activeAction !== null}
                    >
                      <FaRotate />

                      {activeAction === `day-${day.dayNumber}`
                        ? 'Regenerating...'
                        : 'Regenerate day'}
                    </button>
                  </div>
                </header>

                <div className={s.itineraryTimeline}>
                  {day.items.map((item, index) => {
                    const duration = getDurationText(
                      item.startTime,
                      item.endTime,
                    );

                    return (
                      <div
                        className={s.itineraryTimelineItem}
                        key={`${day.dayNumber}-${item.recordId}-${index}`}
                      >
                        <div className={s.itineraryTimelineTime}>
                          <strong>{item.startTime}</strong>
                          <small>{item.endTime}</small>
                        </div>

                        <div className={s.itineraryTimelineMarker}>
                          <span />

                          {index < day.items.length - 1 && <i />}
                        </div>

                        <div className={s.itineraryTimelineContent}>
                          <div className={s.itineraryItemTop}>
                            <div>
                              <span className={s.itineraryItemType}>
                                {item.slot}
                              </span>

                              <span
                                className={s.itineraryItemCategory}
                              >
                                {item.type}
                              </span>
                            </div>

                            <strong>
                              {Number(item.itemCost || 0) === 0
                                ? 'Free'
                                : money(item.itemCost)}
                            </strong>
                          </div>

                          <h4>{item.title}</h4>

                          <div className={s.itineraryItemMeta}>
                            <span>
                              <FaLocationDot />
                              {item.location}
                            </span>

                            {duration && (
                              <span>
                                <FaClock />
                                {duration}
                              </span>
                            )}

                            {Number(item.travelMinutes || 0) > 0 && (
                              <span>
                                <FaRoute />
                                {item.travelMinutes} min transfer
                              </span>
                            )}
                          </div>

                          {item.notes && (
                            <p>{item.notes}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {plan.hotelChoices.length > 1 && (
        <section className={s.itineraryAlternatives}>
          <div className={s.itineraryMainHeading}>
            <div>
              <span className={s.itineraryEyebrow}>
                Accommodation alternatives
              </span>

              <h2>Other suitable places to stay</h2>

              <p>
                These options were also shortlisted for your trip.
              </p>
            </div>
          </div>

          <div className={s.itineraryAlternativeGrid}>
            {plan.hotelChoices
              .filter((hotel) => hotel.id !== plan.hotel.id)
              .slice(0, 3)
              .map((hotel) => (
                <article key={hotel.id}>
                  <img
                    src={imageUrl(hotel.image)}
                    alt={hotel.name}
                    onError={(event) => {
                      event.currentTarget.src = '/fallback.svg';
                    }}
                  />

                  <div>
                    <span>
                      <FaStar />
                      {Number(hotel.rating || 0).toFixed(1)}
                    </span>

                    <h3>{hotel.name}</h3>

                    <p>
                      <FaLocationDot />
                      {hotel.location}
                    </p>

                    <footer>
                      <div>
                        <small>{hotel.room_type}</small>
                        <strong>
                          {money(hotel.price_per_night)}
                          <span>/night</span>
                        </strong>
                      </div>

                      <span>{hotel.hotel_type}</span>
                    </footer>
                  </div>
                </article>
              ))}
          </div>
        </section>
      )}

      {plan.ai.tips.length > 0 && (
        <section className={s.itineraryTips}>
          <div className={s.itineraryTipsHeading}>
            <span>
              <FaCompass />
            </span>

            <div>
              <span className={s.itineraryEyebrow}>
                Before you travel
              </span>

              <h2>Helpful tips for this journey</h2>
            </div>
          </div>

          <div className={s.itineraryTipsGrid}>
            {plan.ai.tips.map((tip, index) => (
              <article key={`${tip}-${index}`}>
                <span>
                  {String(index + 1).padStart(2, '0')}
                </span>

                <p>{tip}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className={s.itineraryBottomCta}>
        <div>
          <span className={s.itineraryEyebrow}>
            Happy with your itinerary?
          </span>

          <h2>Save it now and continue planning later.</h2>

          <p>
            Your saved journey will remain available inside your
            TripGenie dashboard.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={regenerateItinerary}
            disabled={activeAction !== null}
          >
            <FaRotate />
            Regenerate
          </button>

          <button
            type="button"
            onClick={saveTrip}
            disabled={activeAction !== null}
          >
            <FaCheck />
            Save this itinerary
          </button>
        </div>
      </section>
    </div>
  );
}