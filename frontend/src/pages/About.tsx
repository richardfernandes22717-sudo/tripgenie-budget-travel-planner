import { motion } from 'framer-motion';
import {
  FaArrowRight,
  FaCalendarDays,
  FaChartPie,
  FaCircleCheck,
  FaCompass,
  FaHotel,
  FaMapLocationDot,
  FaRoute,
  FaUtensils,
  FaWallet,
  FaWandMagicSparkles,
} from 'react-icons/fa6';
import { Link } from 'react-router-dom';

import s from '../components/ui.module.css';

const principles = [
  {
    icon: FaWallet,
    title: 'Built around your budget',
    description:
      'TripGenie starts with what you can comfortably spend and builds the trip around that amount.',
  },
  {
    icon: FaCompass,
    title: 'Personalized for your interests',
    description:
      'Your preferred destinations, cuisines, activities, hotel style and travel pace shape every recommendation.',
  },
  {
    icon: FaRoute,
    title: 'Practical day-by-day planning',
    description:
      'Each trip is organized into realistic days with meals, attractions, transport and estimated timings.',
  },
];

const processSteps = [
  {
    number: '01',
    title: 'Tell TripGenie about your trip',
    description:
      'Enter your starting location, dates, number of travellers, total budget, interests and travel preferences.',
  },
  {
    number: '02',
    title: 'Explore suitable options',
    description:
      'TripGenie identifies destinations, hotels, restaurants, attractions and transport choices that match your needs.',
  },
  {
    number: '03',
    title: 'Receive a complete itinerary',
    description:
      'Your selected options are organized into a detailed day-wise plan with meals, activities, travel time and costs.',
  },
  {
    number: '04',
    title: 'Edit, improve and save',
    description:
      'Replace recommendations, adjust itinerary items, regenerate a day and save the final plan to your account.',
  },
];

const platformFeatures = [
  {
    icon: FaMapLocationDot,
    title: 'Discover destinations',
    text: 'Explore places based on your budget, preferred experiences, climate and travel season.',
  },
  {
    icon: FaHotel,
    title: 'Choose suitable stays',
    text: 'Compare budget, value and comfort hotel options for your complete trip.',
  },
  {
    icon: FaUtensils,
    title: 'Plan every meal',
    text: 'Find restaurants that match your cuisine, dietary preferences and daily food budget.',
  },
  {
    icon: FaChartPie,
    title: 'Understand every cost',
    text: 'See accommodation, food, attraction, activity and transport expenses clearly.',
  },
];

const travellerBenefits = [
  'Avoid spending hours comparing separate travel websites',
  'Understand the estimated trip cost before making decisions',
  'Find free and paid activities that match your interests',
  'Receive lower-cost options when the plan exceeds your budget',
  'Keep hotels, restaurants and attractions in one itinerary',
  'Save trips and continue planning whenever you return',
];

export default function About() {
  return (
    <div className={s.aboutPage}>
      <section className={s.aboutHero}>
        <div className={`container ${s.aboutHeroInner}`}>
          <motion.div
            className={s.aboutHeroContent}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <span className={s.aboutEyebrow}>About TripGenie</span>

            <h1>
              Your personal guide to
              <span>smarter budget travel.</span>
            </h1>

            <p>
              TripGenie helps travellers discover suitable destinations,
              organize complete itineraries and make better travel decisions
              without losing control of their budget.
            </p>

            <div className={s.aboutHeroActions}>
              <Link className="btn large" to="/register">
                Start planning
                <FaArrowRight />
              </Link>

              <Link className="btn secondary large" to="/explore">
                Explore destinations
              </Link>
            </div>

            <div className={s.aboutHeroChecks}>
              <span>
                <FaCircleCheck />
                Budget-friendly recommendations
              </span>

              <span>
                <FaCircleCheck />
                Complete day-wise plans
              </span>

              <span>
                <FaCircleCheck />
                Fully editable trips
              </span>
            </div>
          </motion.div>

          <motion.div
            className={s.aboutHeroVisual}
            initial={{ opacity: 0, scale: 0.96, x: 25 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <img
              src="https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1400&q=90"
              alt="Historic architecture in Jaipur"
            />

            <div className={s.aboutVisualCard}>
              <span>
                <FaWandMagicSparkles />
              </span>

              <div>
                <small>Personalized travel planning</small>
                <strong>Your budget. Your interests. Your trip.</strong>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className={s.aboutStats}>
        <div className={`container ${s.aboutStatsGrid}`}>
          <article>
            <strong>25+</strong>
            <span>Destinations to explore</span>
          </article>

          <article>
            <strong>100+</strong>
            <span>Hotel choices</span>
          </article>

          <article>
            <strong>125+</strong>
            <span>Restaurant options</span>
          </article>

          <article>
            <strong>150+</strong>
            <span>Attractions and activities</span>
          </article>
        </div>
      </section>

      <section className={s.aboutPurpose}>
        <div className={`container ${s.aboutPurposeGrid}`}>
          <div className={s.aboutPurposeContent}>
            <span className={s.aboutEyebrow}>Why TripGenie exists</span>

            <h2>
              Travel planning should feel
              <br />
              exciting, not exhausting.
            </h2>

            <p>
              Planning a trip often means opening many websites, comparing
              different prices and manually arranging every hotel, meal,
              attraction and transport option.
            </p>

            <p>
              TripGenie brings those decisions into one convenient experience.
              It helps you understand what is possible within your budget and
              creates an organized plan that you can personalize before saving.
            </p>

            <div className={s.aboutPurposeNote}>
              <span>
                <FaWallet />
              </span>

              <div>
                <strong>Your budget remains the priority.</strong>

                <p>
                  TripGenie shows where your money is being used and recommends
                  more affordable alternatives when the estimated plan becomes
                  too expensive.
                </p>
              </div>
            </div>
          </div>

          <div className={s.aboutPurposeImage}>
            <img
              src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=88"
              alt="Indian travel destination"
            />

            <div className={s.aboutImageMetric}>
              <small>Our planning approach</small>
              <strong>Budget first. Experience always.</strong>
            </div>
          </div>
        </div>
      </section>

      <section className={s.aboutValues}>
        <div className="container">
          <div className={s.aboutSectionHeading}>
            <span className={s.aboutEyebrow}>What makes it different</span>

            <h2>A travel planner designed around real decisions.</h2>

            <p>
              TripGenie helps you move from a general travel idea to a complete,
              understandable and editable plan.
            </p>
          </div>

          <div className={s.aboutValuesGrid}>
            {principles.map((principle, index) => {
              const Icon = principle.icon;

              return (
                <motion.article
                  key={principle.title}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.08,
                  }}
                  viewport={{ once: true }}
                >
                  <span className={s.aboutValueIcon}>
                    <Icon />
                  </span>

                  <h3>{principle.title}</h3>
                  <p>{principle.description}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className={s.aboutProcess}>
        <div className={`container ${s.aboutProcessLayout}`}>
          <div className={s.aboutProcessHeading}>
            <span className={s.aboutEyebrow}>How TripGenie works</span>

            <h2>From a travel idea to a complete itinerary.</h2>

            <p>
              TripGenie guides you through a simple planning process while
              keeping every important choice under your control.
            </p>

            <Link className={s.aboutTextLink} to="/register">
              Create your first itinerary
              <FaArrowRight />
            </Link>
          </div>

          <div className={s.aboutProcessList}>
            {processSteps.map((step) => (
              <article key={step.number}>
                <span className={s.aboutProcessNumber}>
                  {step.number}
                </span>

                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={s.aboutPlatform}>
        <div className="container">
          <div className={s.aboutSectionHeading}>
            <span className={s.aboutEyebrow}>Everything in one place</span>

            <h2>Plan the complete journey, not just the destination.</h2>

            <p>
              TripGenie connects the major parts of travel planning so that
              every recommendation works together as one trip.
            </p>
          </div>

          <div className={s.aboutPlatformGrid}>
            {platformFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <article key={feature.title}>
                  <span>
                    <Icon />
                  </span>

                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className={s.aboutTechnology}>
        <div className={`container ${s.aboutTechnologyGrid}`}>
          <div>
            <span className={s.aboutEyebrow}>Made for modern travellers</span>

            <h2>Spend less time organizing and more time looking forward.</h2>

            <p>
              TripGenie is useful for solo travellers, couples, families,
              students and groups who want a practical plan without exceeding
              their expected travel budget.
            </p>
          </div>

          <div className={s.aboutTechnologyList}>
            {travellerBenefits.map((benefit, index) => (
              <div key={benefit}>
                <small>Benefit {String(index + 1).padStart(2, '0')}</small>

                <strong>{benefit}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={s.aboutCtaSection}>
        <div className={`container ${s.aboutCta}`}>
          <div>
            <span className={s.aboutCtaEyebrow}>
              Your journey begins with one simple plan
            </span>

            <h2>
              Tell TripGenie what you enjoy and how much you want to spend.
            </h2>
          </div>

          <Link to="/register">
            Plan my trip
            <FaArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
}