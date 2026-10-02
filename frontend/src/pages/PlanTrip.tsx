import { useEffect, useMemo, useState, type FormEvent } from 'react';
import axios from 'axios';
import {
  FaArrowLeft,
  FaArrowRight,
  FaBed,
  FaCalendarDays,
  FaCircleCheck,
  FaCircleExclamation,
  FaCompass,
  FaHotel,
  FaLocationDot,
  FaRoute,
  FaUtensils,
  FaWandMagicSparkles,
  FaWallet,
} from 'react-icons/fa6';
import { useNavigate, useSearchParams } from 'react-router-dom';

import api, { imageUrl } from '../api/client';
import type { Destination } from '../types';
import s from '../components/ui.module.css';

type TripForm = {
  origin: string;
  destinationId: string;
  totalBudget: number;
  travellers: number;
  days: number;
  startDate: string;
  endDate: string;
  interests: string;
  cuisines: string;
  dietaryRequirements: string;
  hotelPreference: string;
  transportPreference: string;
  travelStyle: string;
  contingencyPercent: number;
  miscellaneous: number;
};

const steps = [
  {
    title: 'Journey',
    shortTitle: 'Journey',
    description: 'Where and when are you travelling?',
    icon: FaLocationDot,
  },
  {
    title: 'Budget',
    shortTitle: 'Budget',
    description: 'Set your travellers and spending limit.',
    icon: FaWallet,
  },
  {
    title: 'Interests',
    shortTitle: 'Interests',
    description: 'Choose the experiences you enjoy.',
    icon: FaCompass,
  },
  {
    title: 'Preferences',
    shortTitle: 'Preferences',
    description: 'Tell us how you prefer to stay and travel.',
    icon: FaHotel,
  },
  {
    title: 'Review',
    shortTitle: 'Review',
    description: 'Confirm everything before generating.',
    icon: FaCircleCheck,
  },
] as const;

const interestOptions = [
  'Nature',
  'Adventure',
  'History',
  'Culture',
  'Religious',
  'Beach',
  'Wildlife',
  'Shopping',
  'Food',
  'Nightlife',
  'Family',
  'Photography',
];

const cuisineOptions = [
  'Indian',
  'Local',
  'South Indian',
  'North Indian',
  'Continental',
  'Chinese',
  'Italian',
  'Street Food',
];

const dietaryOptions = [
  'Vegetarian',
  'Vegan',
  'Halal',
  'Gluten-free',
  'Jain-friendly',
  'Mixed menu',
];

const hotelOptions = [
  {
    value: 'budget',
    title: 'Budget stay',
    description: 'Affordable and practical accommodation.',
  },
  {
    value: 'mid-range',
    title: 'Best value',
    description: 'Comfort and convenience at a balanced price.',
  },
  {
    value: 'premium',
    title: 'Premium comfort',
    description: 'Higher-rated stays with more facilities.',
  },
  {
    value: 'homestay',
    title: 'Local homestay',
    description: 'A personal and locally inspired experience.',
  },
];

const transportOptions = [
  {
    value: 'mixed',
    title: 'Smart mix',
    description: 'Select the most suitable combination.',
  },
  {
    value: 'train',
    title: 'Train',
    description: 'Prioritize railway travel where available.',
  },
  {
    value: 'bus',
    title: 'Bus',
    description: 'Choose economical road transportation.',
  },
  {
    value: 'flight',
    title: 'Flight',
    description: 'Prioritize shorter travel time.',
  },
  {
    value: 'cab',
    title: 'Cab',
    description: 'Prefer flexible private transportation.',
  },
];

const travelStyles = [
  {
    value: 'slow',
    title: 'Slow and relaxed',
    description: 'Fewer activities with more time at each place.',
  },
  {
    value: 'balanced',
    title: 'Balanced',
    description: 'A comfortable mix of exploration and rest.',
  },
  {
    value: 'packed',
    title: 'Activity packed',
    description: 'Fit more attractions into every day.',
  },
  {
    value: 'luxury',
    title: 'Comfort focused',
    description: 'Prioritize premium and convenient experiences.',
  },
];

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function addDays(dateValue: string, numberOfDays: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + numberOfDays);

  return formatDateInput(date);
}

function formatDisplayDate(value: string) {
  if (!value) return 'Not selected';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function formatINR(value: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function parseCsv(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function PlanTrip() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const today = useMemo(() => new Date(), []);
  const initialStartDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return formatDateInput(date);
  }, []);

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loadingDestinations, setLoadingDestinations] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<TripForm>({
    origin: 'Bengaluru',
    destinationId: searchParams.get('destination') || '',
    totalBudget: 25000,
    travellers: 2,
    days: 3,
    startDate: initialStartDate,
    endDate: addDays(initialStartDate, 2),
    interests: 'Nature,Culture,Photography',
    cuisines: 'Indian,Local',
    dietaryRequirements: 'Vegetarian',
    hotelPreference: 'budget',
    transportPreference: 'mixed',
    travelStyle: 'balanced',
    contingencyPercent: 5,
    miscellaneous: 1000,
  });

  useEffect(() => {
    let active = true;

    const loadDestinations = async () => {
      setLoadingDestinations(true);

      try {
        const response = await api.get('/destinations', {
          params: {
            limit: 100,
          },
        });

        if (active) {
          setDestinations(response.data.data.items || []);
        }
      } catch {
        if (active) {
          setError('Destinations could not be loaded.');
        }
      } finally {
        if (active) {
          setLoadingDestinations(false);
        }
      }
    };

    void loadDestinations();

    return () => {
      active = false;
    };
  }, []);

  const selectedDestination = useMemo(
    () =>
      destinations.find(
        (destination) =>
          destination.id === Number(form.destinationId),
      ),
    [destinations, form.destinationId],
  );

  const selectedInterests = useMemo(
    () => parseCsv(form.interests),
    [form.interests],
  );

  const selectedCuisines = useMemo(
    () => parseCsv(form.cuisines),
    [form.cuisines],
  );

  const selectedDietaryOptions = useMemo(
    () => parseCsv(form.dietaryRequirements),
    [form.dietaryRequirements],
  );

  const planningPreview = useMemo(() => {
    const total = Number(form.totalBudget || 0);
    const contingency =
      total * (Number(form.contingencyPercent || 0) / 100);
    const miscellaneous = Number(form.miscellaneous || 0);

    const usableBudget = Math.max(
      0,
      total - contingency - miscellaneous,
    );

    return {
      accommodation: usableBudget * 0.35,
      food: usableBudget * 0.22,
      transport: usableBudget * 0.23,
      experiences: usableBudget * 0.2,
      contingency,
      miscellaneous,
      perPerson:
        form.travellers > 0 ? total / form.travellers : total,
      perDay: form.days > 0 ? total / form.days : total,
    };
  }, [
    form.totalBudget,
    form.contingencyPercent,
    form.miscellaneous,
    form.travellers,
    form.days,
  ]);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const updateField = <Key extends keyof TripForm>(
    key: Key,
    value: TripForm[Key],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateStartDate = (startDate: string) => {
    setForm((current) => ({
      ...current,
      startDate,
      endDate: addDays(startDate, Math.max(0, current.days - 1)),
    }));
  };

  const updateDays = (days: number) => {
    const safeDays = Math.max(1, Math.min(30, days || 1));

    setForm((current) => ({
      ...current,
      days: safeDays,
      endDate: addDays(
        current.startDate,
        Math.max(0, safeDays - 1),
      ),
    }));
  };

  const toggleCsvOption = (
    field:
      | 'interests'
      | 'cuisines'
      | 'dietaryRequirements',
    option: string,
  ) => {
    const currentValues = parseCsv(form[field]);

    const nextValues = currentValues.includes(option)
      ? currentValues.filter((value) => value !== option)
      : [...currentValues, option];

    updateField(field, nextValues.join(','));
  };

  const validateStep = (step: number) => {
    setError('');

    if (step === 0) {
      if (!form.origin.trim()) {
        setError('Enter your starting location.');
        return false;
      }

      if (!form.destinationId) {
        setError('Choose a destination.');
        return false;
      }

      if (!form.startDate) {
        setError('Choose a travel start date.');
        return false;
      }
    }

    if (step === 1) {
      if (form.totalBudget < 1000) {
        setError('Your total budget must be at least ₹1,000.');
        return false;
      }

      if (form.travellers < 1 || form.travellers > 30) {
        setError('Traveller count must be between 1 and 30.');
        return false;
      }

      if (form.days < 1 || form.days > 30) {
        setError('Trip duration must be between 1 and 30 days.');
        return false;
      }
    }

    if (step === 2 && selectedInterests.length === 0) {
      setError('Select at least one travel interest.');
      return false;
    }

    return true;
  };

  const goNext = () => {
    if (!validateStep(currentStep)) return;

    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setError('');
    setCurrentStep((step) => Math.max(step - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const generateItinerary = async () => {
    if (!validateStep(4)) return;

    setBusy(true);
    setError('');

    try {
      const response = await api.post('/ai/generate-itinerary', {
        ...form,
        destinationId: Number(form.destinationId),
        totalBudget: Number(form.totalBudget),
        travellers: Number(form.travellers),
        days: Number(form.days),
        contingencyPercent: Number(form.contingencyPercent),
        miscellaneous: Number(form.miscellaneous),
      });

      sessionStorage.setItem(
        'tripgenie_plan',
        JSON.stringify(response.data.data),
      );

      navigate('/itinerary');
    } catch (requestError: unknown) {
      const message = axios.isAxiosError(requestError)
        ? requestError.response?.data?.message
        : null;

      setError(message || 'The itinerary could not be generated.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (currentStep < steps.length - 1) {
      goNext();
      return;
    }

    void generateItinerary();
  };

  const renderJourneyStep = () => (
    <div className={s.planTripStepContent}>
      <div className={s.planTripSectionHeading}>
        <span className={s.planTripSectionNumber}>01</span>

        <div>
          <h2>Where are you going?</h2>
          <p>
            Select your route and travel dates to begin building the
            itinerary.
          </p>
        </div>
      </div>

      <div className={s.planTripFormGrid}>
        <label className={s.planTripField}>
          <span>Starting location</span>

          <div className={s.planTripInputIcon}>
            <FaLocationDot />

            <input
              value={form.origin}
              onChange={(event) =>
                updateField('origin', event.target.value)
              }
              placeholder="For example, Bengaluru"
              required
            />
          </div>
        </label>

        <label className={s.planTripField}>
          <span>Destination</span>

          <div className={s.planTripInputIcon}>
            <FaCompass />

            <select
              value={form.destinationId}
              onChange={(event) =>
                updateField('destinationId', event.target.value)
              }
              disabled={loadingDestinations}
              required
            >
              <option value="">
                {loadingDestinations
                  ? 'Loading destinations...'
                  : 'Choose a destination'}
              </option>

              {destinations.map((destination) => (
                <option
                  value={destination.id}
                  key={destination.id}
                >
                  {destination.name}, {destination.state}
                </option>
              ))}
            </select>
          </div>
        </label>

        <label className={s.planTripField}>
          <span>Start date</span>

          <div className={s.planTripInputIcon}>
            <FaCalendarDays />

            <input
              type="date"
              min={formatDateInput(today)}
              value={form.startDate}
              onChange={(event) =>
                updateStartDate(event.target.value)
              }
              required
            />
          </div>
        </label>

        <label className={s.planTripField}>
          <span>End date</span>

          <div className={s.planTripInputIcon}>
            <FaCalendarDays />

            <input
              type="date"
              value={form.endDate}
              readOnly
            />
          </div>

          <small>
            Automatically calculated from the trip duration.
          </small>
        </label>
      </div>

      {selectedDestination && (
        <article className={s.planTripSelectedDestination}>
          <img
            src={imageUrl(selectedDestination.image)}
            alt={selectedDestination.name}
            onError={(event) => {
              event.currentTarget.src = '/fallback.svg';
            }}
          />

          <div>
            <span>
              <FaLocationDot />
              {selectedDestination.city},{' '}
              {selectedDestination.state}
            </span>

            <h3>{selectedDestination.name}</h3>

            <p>{selectedDestination.description}</p>

            <div>
              <small>
                <strong>Best season</strong>
                {selectedDestination.best_season}
              </small>

              <small>
                <strong>Trip starts from</strong>
                {formatINR(selectedDestination.minimum_budget)}
              </small>

              <small>
                <strong>Daily average</strong>
                {formatINR(selectedDestination.average_daily_cost)}
              </small>
            </div>
          </div>
        </article>
      )}
    </div>
  );

  const renderBudgetStep = () => (
    <div className={s.planTripStepContent}>
      <div className={s.planTripSectionHeading}>
        <span className={s.planTripSectionNumber}>02</span>

        <div>
          <h2>Set the trip limits</h2>
          <p>
            Your budget and group size guide every recommendation.
          </p>
        </div>
      </div>

      <div className={s.planTripBudgetLayout}>
        <div className={s.planTripFormGrid}>
          <label className={s.planTripField}>
            <span>Total trip budget</span>

            <div className={s.planTripCurrencyInput}>
              <span>₹</span>

              <input
                type="number"
                min="1000"
                step="500"
                value={form.totalBudget}
                onChange={(event) =>
                  updateField(
                    'totalBudget',
                    Number(event.target.value),
                  )
                }
                required
              />
            </div>
          </label>

          <label className={s.planTripField}>
            <span>Number of travellers</span>

            <input
              type="number"
              min="1"
              max="30"
              value={form.travellers}
              onChange={(event) =>
                updateField(
                  'travellers',
                  Number(event.target.value),
                )
              }
              required
            />
          </label>

          <label className={s.planTripField}>
            <span>Number of days</span>

            <input
              type="number"
              min="1"
              max="30"
              value={form.days}
              onChange={(event) =>
                updateDays(Number(event.target.value))
              }
              required
            />
          </label>

          <label className={s.planTripField}>
            <span>Contingency reserve</span>

            <div className={s.planTripPercentageInput}>
              <input
                type="number"
                min="0"
                max="30"
                value={form.contingencyPercent}
                onChange={(event) =>
                  updateField(
                    'contingencyPercent',
                    Number(event.target.value),
                  )
                }
              />

              <span>%</span>
            </div>
          </label>

          <label
            className={`${s.planTripField} ${s.planTripFieldFull}`}
          >
            <span>Miscellaneous reserve</span>

            <div className={s.planTripCurrencyInput}>
              <span>₹</span>

              <input
                type="number"
                min="0"
                step="100"
                value={form.miscellaneous}
                onChange={(event) =>
                  updateField(
                    'miscellaneous',
                    Number(event.target.value),
                  )
                }
              />
            </div>

            <small>
              Reserved for shopping, emergencies and unplanned
              expenses.
            </small>
          </label>
        </div>

        <aside className={s.planTripBudgetPreview}>
          <span className={s.planTripMiniEyebrow}>
            Planning estimate
          </span>

          <h3>{formatINR(form.totalBudget)}</h3>

          <p>
            A suggested allocation preview. Final totals are
            calculated after selecting actual travel records.
          </p>

          <div className={s.planTripAllocationList}>
            <div>
              <span>
                <i className={s.planTripAllocationHotel} />
                Accommodation
              </span>

              <strong>
                {formatINR(planningPreview.accommodation)}
              </strong>
            </div>

            <div>
              <span>
                <i className={s.planTripAllocationFood} />
                Food
              </span>

              <strong>{formatINR(planningPreview.food)}</strong>
            </div>

            <div>
              <span>
                <i className={s.planTripAllocationTransport} />
                Transport
              </span>

              <strong>
                {formatINR(planningPreview.transport)}
              </strong>
            </div>

            <div>
              <span>
                <i className={s.planTripAllocationActivities} />
                Experiences
              </span>

              <strong>
                {formatINR(planningPreview.experiences)}
              </strong>
            </div>
          </div>

          <div className={s.planTripBudgetMiniStats}>
            <div>
              <small>Per traveller</small>
              <strong>
                {formatINR(planningPreview.perPerson)}
              </strong>
            </div>

            <div>
              <small>Per day</small>
              <strong>{formatINR(planningPreview.perDay)}</strong>
            </div>
          </div>

          {selectedDestination &&
            form.totalBudget <
              Number(selectedDestination.minimum_budget) && (
              <div className={s.planTripBudgetWarning}>
                <FaCircleExclamation />

                <span>
                  The selected destination usually starts from{' '}
                  {formatINR(
                    selectedDestination.minimum_budget,
                  )}
                  . TripGenie will search for lower-cost alternatives.
                </span>
              </div>
            )}
        </aside>
      </div>
    </div>
  );

  const renderInterestsStep = () => (
    <div className={s.planTripStepContent}>
      <div className={s.planTripSectionHeading}>
        <span className={s.planTripSectionNumber}>03</span>

        <div>
          <h2>What would you like to experience?</h2>
          <p>
            Select one or more interests to personalize attractions and
            activities.
          </p>
        </div>
      </div>

      <div className={s.planTripChoiceSection}>
        <div className={s.planTripChoiceHeader}>
          <div>
            <h3>Travel interests</h3>
            <p>Select everything that sounds enjoyable.</p>
          </div>

          <span>{selectedInterests.length} selected</span>
        </div>

        <div className={s.planTripChipGrid}>
          {interestOptions.map((interest) => {
            const selected = selectedInterests.includes(interest);

            return (
              <button
                type="button"
                className={
                  selected ? s.planTripChipSelected : ''
                }
                onClick={() =>
                  toggleCsvOption('interests', interest)
                }
                key={interest}
              >
                {selected && <FaCircleCheck />}
                {interest}
              </button>
            );
          })}
        </div>
      </div>

      <div className={s.planTripStyleSection}>
        <h3>Preferred travel pace</h3>
        <p>Choose how busy you want each itinerary day to feel.</p>

        <div className={s.planTripOptionGrid}>
          {travelStyles.map((style) => (
            <button
              type="button"
              className={
                form.travelStyle === style.value
                  ? s.planTripOptionSelected
                  : ''
              }
              onClick={() =>
                updateField('travelStyle', style.value)
              }
              key={style.value}
            >
              <span>
                {form.travelStyle === style.value ? (
                  <FaCircleCheck />
                ) : (
                  <FaRoute />
                )}
              </span>

              <strong>{style.title}</strong>
              <small>{style.description}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPreferencesStep = () => (
    <div className={s.planTripStepContent}>
      <div className={s.planTripSectionHeading}>
        <span className={s.planTripSectionNumber}>04</span>

        <div>
          <h2>Personalize your stay and meals</h2>
          <p>
            TripGenie will prioritize records that match these
            preferences.
          </p>
        </div>
      </div>

      <div className={s.planTripPreferenceSection}>
        <div className={s.planTripPreferenceHeading}>
          <span>
            <FaBed />
          </span>

          <div>
            <h3>Hotel preference</h3>
            <p>Select the accommodation style you prefer.</p>
          </div>
        </div>

        <div className={s.planTripOptionGrid}>
          {hotelOptions.map((hotel) => (
            <button
              type="button"
              className={
                form.hotelPreference === hotel.value
                  ? s.planTripOptionSelected
                  : ''
              }
              onClick={() =>
                updateField('hotelPreference', hotel.value)
              }
              key={hotel.value}
            >
              <span>
                {form.hotelPreference === hotel.value ? (
                  <FaCircleCheck />
                ) : (
                  <FaHotel />
                )}
              </span>

              <strong>{hotel.title}</strong>
              <small>{hotel.description}</small>
            </button>
          ))}
        </div>
      </div>

      <div className={s.planTripPreferenceSection}>
        <div className={s.planTripPreferenceHeading}>
          <span>
            <FaUtensils />
          </span>

          <div>
            <h3>Food preferences</h3>
            <p>Choose cuisines and dietary requirements.</p>
          </div>
        </div>

        <div className={s.planTripFoodGrid}>
          <div>
            <strong>Preferred cuisines</strong>

            <div className={s.planTripChipGrid}>
              {cuisineOptions.map((cuisine) => {
                const selected =
                  selectedCuisines.includes(cuisine);

                return (
                  <button
                    type="button"
                    className={
                      selected ? s.planTripChipSelected : ''
                    }
                    onClick={() =>
                      toggleCsvOption('cuisines', cuisine)
                    }
                    key={cuisine}
                  >
                    {selected && <FaCircleCheck />}
                    {cuisine}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <strong>Dietary requirements</strong>

            <div className={s.planTripChipGrid}>
              {dietaryOptions.map((diet) => {
                const selected =
                  selectedDietaryOptions.includes(diet);

                return (
                  <button
                    type="button"
                    className={
                      selected ? s.planTripChipSelected : ''
                    }
                    onClick={() =>
                      toggleCsvOption(
                        'dietaryRequirements',
                        diet,
                      )
                    }
                    key={diet}
                  >
                    {selected && <FaCircleCheck />}
                    {diet}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className={s.planTripPreferenceSection}>
        <div className={s.planTripPreferenceHeading}>
          <span>
            <FaRoute />
          </span>

          <div>
            <h3>Transport preference</h3>
            <p>Choose your preferred way to reach the destination.</p>
          </div>
        </div>

        <div className={s.planTripTransportGrid}>
          {transportOptions.map((transport) => (
            <button
              type="button"
              className={
                form.transportPreference === transport.value
                  ? s.planTripOptionSelected
                  : ''
              }
              onClick={() =>
                updateField(
                  'transportPreference',
                  transport.value,
                )
              }
              key={transport.value}
            >
              <span>
                {form.transportPreference === transport.value ? (
                  <FaCircleCheck />
                ) : (
                  <FaRoute />
                )}
              </span>

              <strong>{transport.title}</strong>
              <small>{transport.description}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className={s.planTripStepContent}>
      <div className={s.planTripSectionHeading}>
        <span className={s.planTripSectionNumber}>05</span>

        <div>
          <h2>Review your trip request</h2>
          <p>
            Confirm the information below before generating your
            itinerary.
          </p>
        </div>
      </div>

      <div className={s.planTripReviewHero}>
        <div>
          <span className={s.planTripMiniEyebrow}>
            Your proposed journey
          </span>

          <h3>
            {form.origin} to{' '}
            {selectedDestination?.name || 'your destination'}
          </h3>

          <p>
            {formatDisplayDate(form.startDate)} –{' '}
            {formatDisplayDate(form.endDate)}
          </p>
        </div>

        <div>
          <small>Total trip budget</small>
          <strong>{formatINR(form.totalBudget)}</strong>
        </div>
      </div>

      <div className={s.planTripReviewGrid}>
        <article>
          <span>
            <FaCalendarDays />
          </span>

          <div>
            <small>Trip details</small>
            <strong>
              {form.days} {form.days === 1 ? 'day' : 'days'} ·{' '}
              {form.travellers}{' '}
              {form.travellers === 1
                ? 'traveller'
                : 'travellers'}
            </strong>
          </div>

          <button
            type="button"
            onClick={() => setCurrentStep(0)}
          >
            Edit
          </button>
        </article>

        <article>
          <span>
            <FaWallet />
          </span>

          <div>
            <small>Budget settings</small>
            <strong>
              {form.contingencyPercent}% contingency ·{' '}
              {formatINR(form.miscellaneous)} reserve
            </strong>
          </div>

          <button
            type="button"
            onClick={() => setCurrentStep(1)}
          >
            Edit
          </button>
        </article>

        <article>
          <span>
            <FaCompass />
          </span>

          <div>
            <small>Interests</small>
            <strong>
              {selectedInterests.join(', ') || 'Not selected'}
            </strong>
          </div>

          <button
            type="button"
            onClick={() => setCurrentStep(2)}
          >
            Edit
          </button>
        </article>

        <article>
          <span>
            <FaHotel />
          </span>

          <div>
            <small>Stay and travel</small>
            <strong>
              {form.hotelPreference} hotel ·{' '}
              {form.transportPreference} transport ·{' '}
              {form.travelStyle} pace
            </strong>
          </div>

          <button
            type="button"
            onClick={() => setCurrentStep(3)}
          >
            Edit
          </button>
        </article>

        <article>
          <span>
            <FaUtensils />
          </span>

          <div>
            <small>Food preferences</small>
            <strong>
              {selectedCuisines.join(', ') || 'Any cuisine'}
            </strong>

            <p>
              {selectedDietaryOptions.join(', ') ||
                'No dietary requirements'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCurrentStep(3)}
          >
            Edit
          </button>
        </article>
      </div>

      <div className={s.planTripGenerateNotice}>
        <span>
          <FaWandMagicSparkles />
        </span>

        <div>
          <strong>Ready to build your itinerary</strong>

          <p>
            TripGenie will shortlist suitable hotels, restaurants,
            attractions and transportation before organizing your
            day-wise plan.
          </p>
        </div>
      </div>
    </div>
  );

  const stepContent = [
    renderJourneyStep,
    renderBudgetStep,
    renderInterestsStep,
    renderPreferencesStep,
    renderReviewStep,
  ];

  const CurrentStepIcon = steps[currentStep].icon;

  return (
    <div className={s.planTripPage}>
      <section className={s.planTripHeader}>
        <div>
          <span className={s.planTripEyebrow}>
            <FaWandMagicSparkles />
            Smart trip planner
          </span>

          <h1>Build a trip around what matters to you.</h1>

          <p>
            Complete the steps below and TripGenie will create a
            practical, budget-aware day-wise itinerary.
          </p>
        </div>

        <aside className={s.planTripHeaderStatus}>
          <span>
            <CurrentStepIcon />
          </span>

          <div>
            <small>
              Step {currentStep + 1} of {steps.length}
            </small>

            <strong>{steps[currentStep].title}</strong>

            <p>{steps[currentStep].description}</p>
          </div>
        </aside>
      </section>

      <div className={s.planTripProgressSection}>
        <div className={s.planTripProgressBar}>
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className={s.planTripSteps}>
          {steps.map((step, index) => {
            const Icon = step.icon;
            const completed = index < currentStep;
            const active = index === currentStep;

            return (
              <button
                type="button"
                className={`${active ? s.planTripStepActive : ''} ${
                  completed ? s.planTripStepCompleted : ''
                }`}
                onClick={() => {
                  if (index <= currentStep) {
                    setError('');
                    setCurrentStep(index);
                  }
                }}
                key={step.title}
              >
                <span>
                  {completed ? <FaCircleCheck /> : <Icon />}
                </span>

                <strong>{step.shortTitle}</strong>
              </button>
            );
          })}
        </div>
      </div>

      <form
        className={s.planTripWizard}
        onSubmit={handleSubmit}
      >
        {error && (
          <div className={s.planTripError} role="alert">
            <FaCircleExclamation />
            <span>{error}</span>
          </div>
        )}

        {stepContent[currentStep]()}

        <footer className={s.planTripActions}>
          <div>
            {currentStep > 0 && (
              <button
                type="button"
                className={s.planTripBackButton}
                onClick={goBack}
                disabled={busy}
              >
                <FaArrowLeft />
                Previous
              </button>
            )}
          </div>

          {currentStep < steps.length - 1 ? (
            <button
              type="submit"
              className={s.planTripNextButton}
            >
              Continue
              <FaArrowRight />
            </button>
          ) : (
            <button
              type="submit"
              className={s.planTripGenerateButton}
              disabled={busy}
            >
              {busy ? (
                <>
                  <span className={s.planTripButtonSpinner} />
                  Building your itinerary...
                </>
              ) : (
                <>
                  <FaWandMagicSparkles />
                  Generate itinerary
                </>
              )}
            </button>
          )}
        </footer>
      </form>
    </div>
  );
}