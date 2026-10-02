import { FaWandMagicSparkles } from 'react-icons/fa6';
import s from './ui.module.css';

export default function Brand() {
  return (
    <span className={s.brand}>
      <span className={s.mark}>
        <FaWandMagicSparkles />
      </span>

      <span className={s.brandText}>
        <strong>TripGenie</strong>
        <small>AI-Based Budget Travel Planner</small>
      </span>
    </span>
  );
}