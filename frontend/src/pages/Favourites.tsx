import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import type { IconType } from 'react-icons';
import {
  FaArrowRight,
  FaBuilding,
  FaCircleExclamation,
  FaCompass,
  FaHeart,
  FaHotel,
  FaLandmark,
  FaLocationDot,
  FaMagnifyingGlass,
  FaMapLocationDot,
  FaTrash,
  FaUtensils,
  FaXmark,
} from 'react-icons/fa6';
import { Link } from 'react-router-dom';

import api, { imageUrl } from '../api/client';
import s from '../components/ui.module.css';

type Favourite = {
  id: number;
  item_type: 'destination' | 'hotel' | 'restaurant' | 'attraction';
  item_id: number;
  item_name?: string;
  image?: string;
  created_at?: string;
};

type FavouriteType = {
  value: string;
  label: string;
  icon: IconType;
};

const favouriteTypes: FavouriteType[] = [
  {
    value: 'all',
    label: 'All favourites',
    icon: FaHeart,
  },
  {
    value: 'destination',
    label: 'Destinations',
    icon: FaMapLocationDot,
  },
  {
    value: 'hotel',
    label: 'Hotels',
    icon: FaHotel,
  },
  {
    value: 'restaurant',
    label: 'Restaurants',
    icon: FaUtensils,
  },
  {
    value: 'attraction',
    label: 'Attractions',
    icon: FaLandmark,
  },
];

const getTypeConfig = (type: Favourite['item_type']) => {
  const config = favouriteTypes.find((item) => item.value === type);

  return (
    config || {
      value: type,
      label: type,
      icon: FaCompass,
    }
  );
};

const formatSavedDate = (value?: string) => {
  if (!value) return 'Saved to your collection';

  return `Saved ${new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))}`;
};

export default function Favourites() {
  const [items, setItems] = useState<Favourite[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingKey, setRemovingKey] = useState('');
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadFavourites = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/favourites');

      setItems(
        Array.isArray(response.data.data) ? response.data.data : [],
      );
    } catch (requestError: unknown) {
      const requestMessage = axios.isAxiosError(requestError)
        ? requestError.response?.data?.message
        : null;

      setError(
        requestMessage || 'Your favourites could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFavourites();
  }, [loadFavourites]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesType =
        activeType === 'all' || item.item_type === activeType;

      const matchesSearch =
        !normalizedSearch ||
        (item.item_name || '')
          .toLowerCase()
          .includes(normalizedSearch) ||
        item.item_type.toLowerCase().includes(normalizedSearch);

      return matchesType && matchesSearch;
    });
  }, [items, search, activeType]);

  const counts = useMemo(
    () => ({
      all: items.length,
      destination: items.filter(
        (item) => item.item_type === 'destination',
      ).length,
      hotel: items.filter((item) => item.item_type === 'hotel')
        .length,
      restaurant: items.filter(
        (item) => item.item_type === 'restaurant',
      ).length,
      attraction: items.filter(
        (item) => item.item_type === 'attraction',
      ).length,
    }),
    [items],
  );

  const removeFavourite = async (item: Favourite) => {
    const key = `${item.item_type}-${item.item_id}`;

    setRemovingKey(key);
    setError('');
    setMessage('');

    try {
      await api.delete(
        `/favourites/${item.item_type}/${item.item_id}`,
      );

      setItems((current) =>
        current.filter(
          (savedItem) =>
            !(
              savedItem.item_type === item.item_type &&
              savedItem.item_id === item.item_id
            ),
        ),
      );

      setMessage(
        `${item.item_name || 'The item'} was removed from favourites.`,
      );
    } catch (requestError: unknown) {
      const requestMessage = axios.isAxiosError(requestError)
        ? requestError.response?.data?.message
        : null;

      setError(
        requestMessage || 'The favourite could not be removed.',
      );
    } finally {
      setRemovingKey('');
    }
  };

  return (
    <div className={s.favPage}>
      <section className={s.favHero}>
        <div className={s.favHeroContent}>
          <span className={s.favEyebrow}>
            <FaHeart />
            Your travel collection
          </span>

          <h1>
            Keep the places you
            <span>do not want to forget.</span>
          </h1>

          <p>
            Save inspiring destinations, comfortable hotels, local
            restaurants and attractions while preparing your next
            journey.
          </p>

          <Link className={s.favHeroButton} to="/explore">
            Explore more places
            <FaArrowRight />
          </Link>
        </div>

        <div className={s.favHeroArt}>
          <div className={s.favHeroStack}>
            <div>
              <FaMapLocationDot />
              <span>Dream destinations</span>
            </div>

            <div>
              <FaHotel />
              <span>Favourite stays</span>
            </div>

            <div>
              <FaUtensils />
              <span>Places to eat</span>
            </div>
          </div>

          <div className={s.favHeroCount}>
            <small>Saved items</small>
            <strong>{loading ? '—' : items.length}</strong>
            <span>Your personal travel shortlist</span>
          </div>
        </div>
      </section>

      {message && (
        <div className={s.favNotice}>
          <FaHeart />
          <span>{message}</span>

          <button
            type="button"
            aria-label="Close message"
            onClick={() => setMessage('')}
          >
            <FaXmark />
          </button>
        </div>
      )}

      {error && (
        <div className={`${s.favNotice} ${s.favNoticeError}`}>
          <FaCircleExclamation />
          <span>{error}</span>

          <button type="button" onClick={() => void loadFavourites()}>
            Try again
          </button>
        </div>
      )}

      <section className={s.favMetrics}>
        <article>
          <span>
            <FaHeart />
          </span>

          <div>
            <small>All favourites</small>
            <strong>{loading ? '—' : counts.all}</strong>
            <p>Your complete saved collection</p>
          </div>
        </article>

        <article>
          <span>
            <FaMapLocationDot />
          </span>

          <div>
            <small>Destinations</small>
            <strong>{loading ? '—' : counts.destination}</strong>
            <p>Places you would like to visit</p>
          </div>
        </article>

        <article>
          <span>
            <FaHotel />
          </span>

          <div>
            <small>Hotels</small>
            <strong>{loading ? '—' : counts.hotel}</strong>
            <p>Accommodation you shortlisted</p>
          </div>
        </article>

        <article>
          <span>
            <FaBuilding />
          </span>

          <div>
            <small>Experiences</small>
            <strong>
              {loading
                ? '—'
                : counts.restaurant + counts.attraction}
            </strong>
            <p>Food and attraction choices</p>
          </div>
        </article>
      </section>

      <section className={s.favToolbar}>
        <div className={s.favSearch}>
          <FaMagnifyingGlass />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search your saved collection"
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
        </div>

        <div className={s.favTypeFilters}>
          {favouriteTypes.map((type) => {
            const Icon = type.icon;
            const count =
              counts[type.value as keyof typeof counts] || 0;

            return (
              <button
                type="button"
                className={
                  activeType === type.value ? s.favFilterActive : ''
                }
                onClick={() => setActiveType(type.value)}
                key={type.value}
              >
                <Icon />
                {type.label}
                <span>{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className={s.favResultsHeading}>
        <div>
          <strong>
            {loading
              ? 'Loading your favourites...'
              : `${filteredItems.length} ${
                  filteredItems.length === 1 ? 'item' : 'items'
                } shown`}
          </strong>

          <span>
            Use filters to quickly find destinations, stays and
            experiences.
          </span>
        </div>

        {(search || activeType !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setActiveType('all');
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className={s.favGrid}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div className={s.favSkeleton} key={item} />
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className={s.favGrid}>
          {filteredItems.map((item) => {
            const config = getTypeConfig(item.item_type);
            const Icon = config.icon;
            const key = `${item.item_type}-${item.item_id}`;
            const isDestination =
              item.item_type === 'destination';

            return (
              <article className={s.favCard} key={item.id}>
                <div className={s.favCardImage}>
                  <img
                    src={imageUrl(item.image)}
                    alt={item.item_name || config.label}
                    onError={(event) => {
                      event.currentTarget.src = '/fallback.svg';
                    }}
                  />

                  <div className={s.favCardOverlay} />

                  <span className={s.favTypeBadge}>
                    <Icon />
                    {config.label.replace(/s$/, '')}
                  </span>

                  <button
                    type="button"
                    className={s.favRemoveButton}
                    aria-label={`Remove ${
                      item.item_name || 'item'
                    } from favourites`}
                    disabled={removingKey === key}
                    onClick={() => void removeFavourite(item)}
                  >
                    <FaTrash />
                  </button>
                </div>

                <div className={s.favCardBody}>
                  <div className={s.favCardMeta}>
                    <span>
                      <FaLocationDot />
                      Saved {config.label.toLowerCase()}
                    </span>

                    <small>{formatSavedDate(item.created_at)}</small>
                  </div>

                  <h2>
                    {item.item_name || `Saved ${item.item_type}`}
                  </h2>

                  <p>
                    {item.item_type === 'destination'
                      ? 'Open this destination to review its budget, season and travel experiences.'
                      : item.item_type === 'hotel'
                        ? 'A shortlisted accommodation option for one of your future journeys.'
                        : item.item_type === 'restaurant'
                          ? 'A food experience you saved for future itinerary planning.'
                          : 'An attraction you may want to include in your next trip.'}
                  </p>

                  <footer className={s.favCardFooter}>
                    {isDestination ? (
                      <Link
                        to={`/explore/${item.item_id}`}
                        className={s.favOpenLink}
                      >
                        View destination
                        <FaArrowRight />
                      </Link>
                    ) : (
                      <span className={s.favSavedLabel}>
                        <FaHeart />
                        Saved to collection
                      </span>
                    )}
                  </footer>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={s.favEmpty}>
          <span>
            <FaHeart />
          </span>

          <h2>
            {items.length === 0
              ? 'Your favourites are waiting'
              : 'No matching favourites'}
          </h2>

          <p>
            {items.length === 0
              ? 'Explore TripGenie and save destinations, hotels, restaurants and attractions that inspire you.'
              : 'Try another search or select a different collection category.'}
          </p>

          {items.length === 0 ? (
            <Link to="/explore">
              Explore destinations
              <FaArrowRight />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setActiveType('all');
              }}
            >
              Show all favourites
            </button>
          )}
        </div>
      )}
    </div>
  );
}