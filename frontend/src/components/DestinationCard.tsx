import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaArrowRight,
  FaCalendarDays,
  FaHeart,
  FaHotel,
  FaLocationDot,
  FaStar,
  FaWallet,
} from 'react-icons/fa6';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

import api, { imageUrl } from '../api/client';
import type { Destination } from '../types';
import s from './ui.module.css';

type ExploreDestination = Destination & {
  hotel_count?: number;
};

type DestinationCardProps = {
  destination: ExploreDestination;
  index?: number;
};

const formatINR = (value: number | string) =>
  Number(value || 0).toLocaleString('en-IN');

export default function DestinationCard({
  destination,
  index = 0,
}: DestinationCardProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const saveFavourite = async () => {
    if (saving || saved) return;

    setSaving(true);

    try {
      await api.post('/favourites', {
        itemType: 'destination',
        itemId: destination.id,
      });

      setSaved(true);
    } catch (requestError: unknown) {
      if (
        axios.isAxiosError(requestError) &&
        requestError.response?.status === 401
      ) {
        navigate('/login', {
          state: {
            from: location.pathname,
          },
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.article
      className={s.exploreCard}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.05, 0.3),
      }}
    >
      <div className={s.exploreCardImage}>
        <Link
          to={`/explore/${destination.id}`}
          aria-label={`View ${destination.name}`}
        >
          <img
            src={imageUrl(destination.image)}
            alt={`${destination.name}, ${destination.state}`}
            onError={(event) => {
              event.currentTarget.src = '/fallback.svg';
            }}
          />
        </Link>

        <span className={s.exploreCategory}>
          {destination.category}
        </span>

        <button
          type="button"
          className={`${s.exploreFavourite} ${
            saved ? s.exploreFavouriteSaved : ''
          }`}
          onClick={saveFavourite}
          disabled={saving}
          aria-label={
            saved
              ? `${destination.name} saved to favourites`
              : `Save ${destination.name} to favourites`
          }
          title={saved ? 'Saved to favourites' : 'Save destination'}
        >
          <FaHeart />
        </button>

        <div className={s.exploreRating}>
          <FaStar />
          <strong>
            {Number(destination.rating || 0).toFixed(1)}
          </strong>
        </div>
      </div>

      <div className={s.exploreCardBody}>
        <div className={s.exploreCardLocation}>
          <FaLocationDot />
          <span>
            {destination.city}, {destination.state}
          </span>
        </div>

        <Link
          to={`/explore/${destination.id}`}
          className={s.exploreCardTitle}
        >
          <h2>{destination.name}</h2>
        </Link>

        <p className={s.exploreCardDescription}>
          {destination.description ||
            `Discover the best experiences, stays and local attractions in ${destination.name}.`}
        </p>

        <div className={s.exploreCardFacts}>
          <span>
            <FaCalendarDays />
            <small>Best season</small>
            <strong>
              {destination.best_season || 'All year'}
            </strong>
          </span>

          <span>
            <FaHotel />
            <small>Available stays</small>
            <strong>
              {destination.hotel_count ?? 'Multiple'}
            </strong>
          </span>

          <span>
            <FaWallet />
            <small>Daily average</small>
            <strong>
              ₹{formatINR(destination.average_daily_cost)}
            </strong>
          </span>
        </div>

        <div className={s.exploreCardFooter}>
          <div>
            <small>Suggested starting budget</small>
            <strong>
              ₹{formatINR(destination.minimum_budget)}
            </strong>
          </div>

          <Link
            to={`/explore/${destination.id}`}
            className={s.exploreViewButton}
          >
            View destination
            <FaArrowRight />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}