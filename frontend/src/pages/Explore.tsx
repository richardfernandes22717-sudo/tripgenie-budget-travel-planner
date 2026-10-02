import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  FaArrowLeft,
  FaArrowRight,
  FaCompass,
  FaMagnifyingGlass,
  FaSliders,
  FaWallet,
  FaXmark,
} from 'react-icons/fa6';

import api from '../api/client';
import DestinationCard from '../components/DestinationCard';
import type { Destination } from '../types';
import s from '../components/ui.module.css';

type ExploreDestination = Destination & {
  hotel_count?: number;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

const categories = [
  'Beach',
  'Nature',
  'History',
  'Culture',
  'Adventure',
  'Metropolitan',
  'Religious',
  'Heritage',
];

const budgetOptions = [
  { label: 'Any budget', value: 1000000 },
  { label: 'Under ₹10,000', value: 10000 },
  { label: 'Under ₹20,000', value: 20000 },
  { label: 'Under ₹35,000', value: 35000 },
  { label: 'Under ₹50,000', value: 50000 },
];

const defaultPagination: Pagination = {
  page: 1,
  limit: 9,
  total: 0,
  pages: 1,
};

export default function Explore() {
  const [items, setItems] = useState<ExploreDestination[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [maxBudget, setMaxBudget] = useState(1000000);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] =
    useState<Pagination>(defaultPagination);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();

    const loadDestinations = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get('/destinations', {
          signal: controller.signal,
          params: {
            search: search || undefined,
            category: category || undefined,
            maxBudget,
            page,
            limit: 9,
          },
        });

        setItems(response.data.data.items ?? []);
        setPagination(
          response.data.data.pagination ?? defaultPagination,
        );
      } catch (requestError: unknown) {
        if (
          axios.isAxiosError(requestError) &&
          requestError.code === 'ERR_CANCELED'
        ) {
          return;
        }

        const message = axios.isAxiosError(requestError)
          ? requestError.response?.data?.message
          : null;

        setError(message || 'Could not load destinations.');
        setItems([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadDestinations();

    return () => controller.abort();
  }, [search, category, maxBudget, page]);

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (search) count += 1;
    if (category) count += 1;
    if (maxBudget !== 1000000) count += 1;

    return count;
  }, [search, category, maxBudget]);

  const selectedBudgetLabel =
    budgetOptions.find((option) => option.value === maxBudget)?.label ??
    'Any budget';

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setCategory('');
    setMaxBudget(1000000);
    setPage(1);
  };

  const changePage = (nextPage: number) => {
    if (
      nextPage < 1 ||
      nextPage > pagination.pages ||
      nextPage === page
    ) {
      return;
    }

    setPage(nextPage);
    window.scrollTo({
      top: 300,
      behavior: 'smooth',
    });
  };

  return (
    <div className={s.explorePage}>
      <section className={s.exploreHero}>
        <div className={s.exploreHeroDecoration} />

        <div className={`container ${s.exploreHeroInner}`}>
          <div className={s.exploreHeroContent}>
            <span className={s.exploreEyebrow}>
              <FaCompass />
              Explore India
            </span>

            <h1>
              Find somewhere
              <span>worth going.</span>
            </h1>

            <p>
              Discover destinations based on your budget, travel style and
              interests. Every location includes real accommodation,
              restaurant and attraction data.
            </p>
          </div>

          <div className={s.exploreHeroSummary}>
            <span>Available destinations</span>

            <strong>
              {loading ? '—' : pagination.total}
            </strong>

            <small>
              Budget, heritage, nature, beach and city experiences
            </small>
          </div>
        </div>
      </section>

      <section className={s.exploreContent}>
        <div className="container">
          <div className={s.exploreFilterPanel}>
            <div className={s.exploreFilterHeading}>
              <div>
                <span className={s.exploreFilterIcon}>
                  <FaSliders />
                </span>

                <div>
                  <strong>Find your destination</strong>
                  <small>
                    Search and narrow the results to match your trip.
                  </small>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  className={s.clearFilters}
                  onClick={clearFilters}
                >
                  <FaXmark />
                  Clear {activeFilterCount}{' '}
                  {activeFilterCount === 1 ? 'filter' : 'filters'}
                </button>
              )}
            </div>

            <div className={s.exploreFilters}>
              <label className={s.exploreSearch}>
                <span>Search destination</span>

                <div>
                  <FaMagnifyingGlass />

                  <input
                    type="search"
                    value={searchInput}
                    onChange={(event) =>
                      setSearchInput(event.target.value)
                    }
                    placeholder="Search city, state or destination"
                  />

                  {searchInput && (
                    <button
                      type="button"
                      aria-label="Clear destination search"
                      onClick={() => setSearchInput('')}
                    >
                      <FaXmark />
                    </button>
                  )}
                </div>
              </label>

              <label className={s.exploreSelect}>
                <span>Experience type</span>

                <select
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All experiences</option>

                  {categories.map((item) => (
                    <option value={item} key={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className={s.exploreSelect}>
                <span>Starting budget</span>

                <select
                  value={maxBudget}
                  onChange={(event) => {
                    setMaxBudget(Number(event.target.value));
                    setPage(1);
                  }}
                >
                  {budgetOptions.map((option) => (
                    <option
                      value={option.value}
                      key={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className={s.exploreResultsHeader}>
            <div>
              <span className={s.exploreResultsCount}>
                {loading
                  ? 'Finding destinations...'
                  : `${pagination.total} ${
                      pagination.total === 1
                        ? 'destination'
                        : 'destinations'
                    } found`}
              </span>

              {!loading && activeFilterCount > 0 && (
                <span className={s.exploreActiveText}>
                  Matching {category || 'all experiences'} ·{' '}
                  {selectedBudgetLabel.toLowerCase()}
                </span>
              )}
            </div>

            <span className={s.explorePageCount}>
              Page {pagination.page} of {Math.max(1, pagination.pages)}
            </span>
          </div>

          {error && (
            <div className={s.exploreError} role="alert">
              <div>
                <strong>Destinations could not be loaded</strong>
                <p>{error}</p>
              </div>

              <button
                type="button"
                className="btn secondary"
                onClick={() => setPage((current) => current)}
              >
                Try again
              </button>
            </div>
          )}

          <div
            className={s.exploreGrid}
            aria-live="polite"
            aria-busy={loading}
          >
            {loading
              ? Array.from({ length: 9 }, (_, index) => (
                  <article
                    className={s.exploreSkeleton}
                    key={index}
                  >
                    <div className={s.exploreSkeletonImage} />

                    <div className={s.exploreSkeletonBody}>
                      <span />
                      <strong />
                      <p />
                      <p />
                      <div />
                    </div>
                  </article>
                ))
              : items.map((destination, index) => (
                  <DestinationCard
                    key={destination.id}
                    destination={destination}
                    index={index}
                  />
                ))}
          </div>

          {!loading && !error && items.length === 0 && (
            <div className={s.exploreEmpty}>
              <span>
                <FaCompass />
              </span>

              <h2>No matching destinations</h2>

              <p>
                Try another city, remove the experience category or
                increase your maximum starting budget.
              </p>

              <button
                type="button"
                className="btn"
                onClick={clearFilters}
              >
                Reset all filters
              </button>
            </div>
          )}

          {!loading &&
            !error &&
            items.length > 0 &&
            pagination.pages > 1 && (
              <nav
                className={s.explorePagination}
                aria-label="Destination pages"
              >
                <button
                  type="button"
                  onClick={() => changePage(page - 1)}
                  disabled={page <= 1}
                >
                  <FaArrowLeft />
                  Previous
                </button>

                <div>
                  {Array.from(
                    { length: pagination.pages },
                    (_, index) => index + 1,
                  )
                    .filter(
                      (number) =>
                        number === 1 ||
                        number === pagination.pages ||
                        Math.abs(number - page) <= 1,
                    )
                    .map((number, index, visiblePages) => {
                      const previous = visiblePages[index - 1];
                      const showGap =
                        previous !== undefined &&
                        number - previous > 1;

                      return (
                        <span key={number}>
                          {showGap && (
                            <span className={s.paginationGap}>
                              …
                            </span>
                          )}

                          <button
                            type="button"
                            className={
                              number === page
                                ? s.paginationActive
                                : ''
                            }
                            onClick={() => changePage(number)}
                            aria-current={
                              number === page ? 'page' : undefined
                            }
                          >
                            {number}
                          </button>
                        </span>
                      );
                    })}
                </div>

                <button
                  type="button"
                  onClick={() => changePage(page + 1)}
                  disabled={page >= pagination.pages}
                >
                  Next
                  <FaArrowRight />
                </button>
              </nav>
            )}
        </div>
      </section>
    </div>
  );
}