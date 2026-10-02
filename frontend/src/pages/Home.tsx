import { motion } from 'framer-motion';
import {
  FaArrowRight,
  FaCalendarDays,
  FaChartLine,
  FaCircleCheck,
  FaCompass,
  FaHotel,
  FaLocationDot,
  FaRobot,
  FaShieldHalved,
  FaUtensils,
  FaWallet,
} from 'react-icons/fa6';
import { Link } from 'react-router-dom';

import s from '../components/ui.module.css';

const destinations = [
  {
    name: 'Agra',
    location: 'Uttar Pradesh',
    category: 'History & Culture',
    image:
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1000&q=85',
    budget: 'From ₹6,500',
  },
  {
    name: 'Jaipur',
    location: 'Rajasthan',
    category: 'Heritage',
    image:
      'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1000&q=85',
    budget: 'From ₹7,800',
  },
  {
    name: 'Goa',
    location: 'West Coast',
    category: 'Beach & Nightlife',
    image:
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=85',
    budget: 'From ₹9,200',
  },
];

const planningSteps = [
  {
    number: '01',
    icon: FaWallet,
    title: 'Set your real budget',
    description:
      'Enter your starting location, dates, travellers, interests and maximum trip budget.',
  },
  {
    number: '02',
    icon: FaRobot,
    title: 'Let TripGenie build',
    description:
      'TripGenie combines verified travel records with Groq AI to organize a practical itinerary.',
  },
  {
    number: '03',
    icon: FaCalendarDays,
    title: 'Review and personalize',
    description:
      'Replace hotels, restaurants or attractions, edit each day and save your final trip.',
  },
];

export default function Home() {
  return (
    <div className={s.homePage}>
      <section className={s.homeHero}>
        <div className={s.homeHeroGlow} />

        <div className={s.homeHeroInner}>
          <motion.div
            className={s.homeHeroContent}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <span className={s.homeEyebrow}>
              India, planned around your budget
            </span>

            <h1>
              Go farther.
              <span>Spend smarter.</span>
            </h1>

            <p className={s.homeHeroDescription}>
              Build practical itineraries from real destination, hotel,
              restaurant, attraction and transport data—then let Groq AI shape
              the details around your preferences.
            </p>

            <div className={s.homeHeroActions}>
              <Link className="btn large" to="/register">
                Plan with AI
                <FaArrowRight />
              </Link>

              <Link className="btn secondary large" to="/explore">
                Browse destinations
              </Link>
            </div>

            <div className={s.homeTrustRow}>
              <span>
                <FaShieldHalved />
                Backend-secured AI
              </span>

              <span>
                <FaChartLine />
                Accurate budget totals
              </span>

              <span>
                <FaCalendarDays />
                Editable day plans
              </span>
            </div>
          </motion.div>

          <motion.div
            className={s.homeHeroVisual}
            initial={{ opacity: 0, scale: 0.97, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.75, delay: 0.1 }}
          >
            <div className={s.homeHeroImage}>
              <img
                src="https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1600&q=90"
                alt="The Taj Mahal in Agra"
              />
            </div>

            <div className={s.budgetFloatingCard}>
              <small>Smart estimate</small>
              <strong>₹18,400</strong>
              <span>4 days · 2 travellers</span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className={s.homeStats}>
        <div className={s.homeStatsInner}>
          <article>
            <strong>25+</strong>
            <span>Indian destinations</span>
          </article>

          <article>
            <strong>100+</strong>
            <span>Verified hotels</span>
          </article>

          <article>
            <strong>125+</strong>
            <span>Restaurant choices</span>
          </article>

          <article>
            <strong>150+</strong>
            <span>Places and activities</span>
          </article>
        </div>
      </section>

      <section className={s.destinationSection}>
        <div className={s.homeSectionInner}>
          <div className={s.homeSectionHeading}>
            <div>
              <span className={s.homeEyebrow}>Start exploring</span>
              <h2>Trips that feel possible.</h2>
              <p>
                Discover destinations with realistic starting budgets,
                experiences and accommodation options.
              </p>
            </div>

            <Link className={s.homeTextLink} to="/explore">
              See every destination
              <FaArrowRight />
            </Link>
          </div>

          <div className={s.homeDestinationGrid}>
            {destinations.map((destination, index) => (
              <motion.article
                className={s.homeDestinationCard}
                key={destination.name}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <Link to="/explore">
                  <div className={s.homeDestinationImage}>
                    <img
                      src={destination.image}
                      alt={`${destination.name}, ${destination.location}`}
                    />

                    <span className={s.homeCategoryPill}>
                      {destination.category}
                    </span>

                    <span className={s.homeCardArrow}>
                      <FaArrowRight />
                    </span>
                  </div>

                  <div className={s.homeDestinationBody}>
                    <div>
                      <span className={s.homeLocation}>
                        <FaLocationDot />
                        {destination.location}
                      </span>

                      <h3>{destination.name}</h3>
                    </div>

                    <strong>{destination.budget}</strong>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className={s.homePlannerSection}>
        <div className={s.homeSectionInner}>
          <div className={s.homePlannerHeading}>
            <span className={s.homeEyebrow}>How TripGenie works</span>

            <h2>
              A complete trip plan,
              <br />
              without the spreadsheet.
            </h2>

            <p>
              From the first budget estimate to the final saved itinerary,
              TripGenie keeps every recommendation practical and editable.
            </p>
          </div>

          <div className={s.homeStepsGrid}>
            {planningSteps.map((step) => {
              const Icon = step.icon;

              return (
                <article className={s.homeStepCard} key={step.number}>
                  <div className={s.homeStepTop}>
                    <span className={s.homeStepIcon}>
                      <Icon />
                    </span>

                    <span className={s.homeStepNumber}>{step.number}</span>
                  </div>

                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className={s.homeFeatureSection}>
        <div className={s.homeSectionInner}>
          <div className={s.homeFeatureGrid}>
            <div className={s.homeFeatureVisual}>
              <img
                src="https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=85"
                alt="Historic architecture in Jaipur"
              />

              <div className={s.featureBudgetWidget}>
                <div className={s.featureBudgetTop}>
                  <span>Budget usage</span>
                  <strong>74%</strong>
                </div>

                <div className={s.featureProgress}>
                  <span />
                </div>

                <div className={s.featureBudgetValues}>
                  <small>Estimated ₹22,200</small>
                  <small>Budget ₹30,000</small>
                </div>
              </div>
            </div>

            <div className={s.homeFeatureContent}>
              <span className={s.homeEyebrow}>More control, less guessing</span>

              <h2>
                Your money decides
                <br />
                the plan.
              </h2>

              <p>
                Every final cost is calculated on the backend from stored
                prices. AI organizes the experience, but it never invents your
                total.
              </p>

              <div className={s.homeFeatureList}>
                <div>
                  <FaCircleCheck />
                  <span>
                    <strong>Real hotel pricing</strong>
                    Accommodation totals use rooms, nights and travellers.
                  </span>
                </div>

                <div>
                  <FaCircleCheck />
                  <span>
                    <strong>Meals inside the itinerary</strong>
                    Restaurants are selected according to cuisine and budget.
                  </span>
                </div>

                <div>
                  <FaCircleCheck />
                  <span>
                    <strong>Lower-cost alternatives</strong>
                    Over-budget plans include practical replacements.
                  </span>
                </div>
              </div>

              <Link className="btn large" to="/register">
                Create my travel plan
                <FaArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={s.homeCategorySection}>
        <div className={s.homeSectionInner}>
          <div className={s.homeSectionHeading}>
            <div>
              <span className={s.homeEyebrow}>One planner, every detail</span>
              <h2>Everything belongs in one trip.</h2>
            </div>
          </div>

          <div className={s.homeCategoryGrid}>
            <article>
              <span>
                <FaHotel />
              </span>
              <h3>Hotels</h3>
              <p>
                Compare budget, value and comfort choices for the complete stay.
              </p>
            </article>

            <article>
              <span>
                <FaUtensils />
              </span>
              <h3>Food</h3>
              <p>
                Add cuisine and dietary preferences to every daily meal plan.
              </p>
            </article>

            <article>
              <span>
                <FaCompass />
              </span>
              <h3>Experiences</h3>
              <p>
                Balance free and paid attractions around your interests.
              </p>
            </article>

            <article>
              <span>
                <FaWallet />
              </span>
              <h3>Budget</h3>
              <p>
                Track category totals, remaining money and per-person cost.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className={s.homeCtaWrapper}>
        <div className={s.homeCta}>
          <div>
            <span className={s.homeCtaEyebrow}>Your next trip starts here</span>

            <h2>Tell TripGenie your budget. Get a plan you can actually use.</h2>
          </div>

          <Link className={s.homeCtaButton} to="/register">
            Start planning free
            <FaArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
}