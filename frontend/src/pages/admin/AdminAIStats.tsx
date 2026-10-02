import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import axios from 'axios';
import {
  FaBolt,
  FaBrain,
  FaChartLine,
  FaCircleCheck,
  FaCircleExclamation,
  FaClock,
  FaDatabase,
  FaMagnifyingGlass,
  FaRobot,
  FaRotate,
  FaWandMagicSparkles,
  FaXmark,
} from 'react-icons/fa6';

import api from '../../api/client';
import s from '../../components/ui.module.css';

type AIBreakdownItem = {
  endpoint: string;
  source: string;
  status: string;
  count: number | string;
  average_ms: number | string | null;
};

type AIStatisticsData = {
  counts: Record<
    string,
    number | string | null | undefined
  >;
  aiBreakdown: AIBreakdownItem[];
};

type SourceFilter = 'all' | 'groq' | 'fallback';

type StatusFilter = 'all' | 'success' | 'error';

const formatNumber = (value: unknown) =>
  Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  });

const formatDuration = (value: unknown) => {
  const milliseconds = Number(value || 0);

  if (!milliseconds) {
    return '—';
  }

  if (milliseconds >= 1000) {
    return `${(milliseconds / 1000).toFixed(2)} sec`;
  }

  return `${Math.round(milliseconds)} ms`;
};

const formatEndpoint = (value?: string) => {
  if (!value) {
    return 'Unknown request';
  }

  return value
    .replace('/api/ai/', '')
    .replace('/ai/', '')
    .replaceAll('-', ' ')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const normalizeSource = (value?: string) =>
  (value || 'unknown').toLowerCase();

const normalizeStatus = (value?: string) =>
  (value || 'unknown').toLowerCase();

export default function AdminAIStats() {
  const [data, setData] =
    useState<AIStatisticsData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] =
    useState<SourceFilter>('all');

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('all');

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/admin/stats');
      const responseData = response.data.data || {};

      setData({
        counts: responseData.counts || {},
        aiBreakdown: Array.isArray(
          responseData.aiBreakdown,
        )
          ? responseData.aiBreakdown
          : [],
      });

      setLastUpdated(new Date());
    } catch (requestError: unknown) {
      const requestMessage = axios.isAxiosError(requestError)
        ? requestError.response?.data?.message
        : null;

      setError(
        requestMessage ||
          'AI request statistics could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatistics();
  }, [loadStatistics]);

  const summary = useMemo(() => {
    const breakdown = data?.aiBreakdown || [];

    const breakdownTotal = breakdown.reduce(
      (total, item) => total + Number(item.count || 0),
      0,
    );

    const totalRequests =
      Number(data?.counts?.ai_request_logs || 0) ||
      breakdownTotal;

    const groqRequests = breakdown
      .filter(
        (item) => normalizeSource(item.source) === 'groq',
      )
      .reduce(
        (total, item) =>
          total + Number(item.count || 0),
        0,
      );

    const fallbackRequests = breakdown
      .filter(
        (item) =>
          normalizeSource(item.source) === 'fallback',
      )
      .reduce(
        (total, item) =>
          total + Number(item.count || 0),
        0,
      );

    const successfulRequests = breakdown
      .filter(
        (item) =>
          normalizeStatus(item.status) === 'success',
      )
      .reduce(
        (total, item) =>
          total + Number(item.count || 0),
        0,
      );

    const failedRequests = Math.max(
      0,
      breakdownTotal - successfulRequests,
    );

    const weightedDuration = breakdown.reduce(
      (total, item) => {
        const count = Number(item.count || 0);
        const average = Number(item.average_ms || 0);

        return total + count * average;
      },
      0,
    );

    const averageDuration =
      breakdownTotal > 0
        ? weightedDuration / breakdownTotal
        : 0;

    const successRate =
      breakdownTotal > 0
        ? Math.round(
            (successfulRequests / breakdownTotal) * 100,
          )
        : 0;

    const groqShare =
      breakdownTotal > 0
        ? Math.round(
            (groqRequests / breakdownTotal) * 100,
          )
        : 0;

    const fastestEndpoint = [...breakdown]
      .filter(
        (item) =>
          Number(item.average_ms || 0) > 0 &&
          normalizeStatus(item.status) === 'success',
      )
      .sort(
        (first, second) =>
          Number(first.average_ms || 0) -
          Number(second.average_ms || 0),
      )[0];

    const slowestEndpoint = [...breakdown]
      .filter(
        (item) => Number(item.average_ms || 0) > 0,
      )
      .sort(
        (first, second) =>
          Number(second.average_ms || 0) -
          Number(first.average_ms || 0),
      )[0];

    return {
      totalRequests,
      groqRequests,
      fallbackRequests,
      successfulRequests,
      failedRequests,
      averageDuration,
      successRate,
      groqShare,
      fastestEndpoint,
      slowestEndpoint,
    };
  }, [data]);

  const filteredBreakdown = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return (data?.aiBreakdown || [])
      .filter((item) => {
        const itemSource = normalizeSource(item.source);
        const itemStatus = normalizeStatus(item.status);

        const matchesSearch =
          !normalizedSearch ||
          item.endpoint
            ?.toLowerCase()
            .includes(normalizedSearch) ||
          itemSource.includes(normalizedSearch) ||
          itemStatus.includes(normalizedSearch);

        const matchesSource =
          sourceFilter === 'all' ||
          itemSource === sourceFilter;

        const matchesStatus =
          statusFilter === 'all' ||
          itemStatus === statusFilter ||
          (statusFilter === 'error' &&
            itemStatus !== 'success');

        return (
          matchesSearch &&
          matchesSource &&
          matchesStatus
        );
      })
      .sort(
        (first, second) =>
          Number(second.count || 0) -
          Number(first.count || 0),
      );
  }, [data, search, sourceFilter, statusFilter]);

  const endpointSummary = useMemo(() => {
    const endpointMap = new Map<
      string,
      {
        endpoint: string;
        requests: number;
        totalDuration: number;
        successes: number;
      }
    >();

    for (const item of data?.aiBreakdown || []) {
      const endpoint = item.endpoint || 'unknown';
      const count = Number(item.count || 0);
      const average = Number(item.average_ms || 0);

      const current = endpointMap.get(endpoint) || {
        endpoint,
        requests: 0,
        totalDuration: 0,
        successes: 0,
      };

      current.requests += count;
      current.totalDuration += count * average;

      if (normalizeStatus(item.status) === 'success') {
        current.successes += count;
      }

      endpointMap.set(endpoint, current);
    }

    return [...endpointMap.values()]
      .map((item) => ({
        ...item,
        averageDuration:
          item.requests > 0
            ? item.totalDuration / item.requests
            : 0,
        successRate:
          item.requests > 0
            ? Math.round(
                (item.successes / item.requests) * 100,
              )
            : 0,
      }))
      .sort(
        (first, second) =>
          second.requests - first.requests,
      );
  }, [data]);

  const resetFilters = () => {
    setSearch('');
    setSourceFilter('all');
    setStatusFilter('all');
  };

  const hasFilters =
    Boolean(search) ||
    sourceFilter !== 'all' ||
    statusFilter !== 'all';

  return (
    <div className={s.adminAIPage}>
      <section className={s.adminAIHero}>
        <div className={s.adminAIHeroCopy}>
          <span className={s.adminAIEyebrow}>
            <FaWandMagicSparkles />
            Groq operations
          </span>

          <h1>Monitor every AI-assisted travel request.</h1>

          <p>
            Review Groq usage, fallback activity, response times and
            request health across itinerary generation and the
            TripGenie assistant.
          </p>

          <div className={s.adminAIHeroActions}>
            <button
              type="button"
              onClick={() => void loadStatistics()}
              disabled={loading}
            >
              <FaRotate />
              {loading
                ? 'Refreshing statistics...'
                : 'Refresh statistics'}
            </button>

            <span>
              <FaClock />
              {lastUpdated
                ? `Updated at ${lastUpdated.toLocaleTimeString(
                    'en-IN',
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                    },
                  )}`
                : 'Waiting for latest data'}
            </span>
          </div>
        </div>

        <aside className={s.adminAIHeroCard}>
          <span>
            <FaBrain />
          </span>

          <div>
            <small>AI request health</small>

            <strong>
              {loading
                ? 'Checking'
                : summary.successRate >= 90
                  ? 'Healthy'
                  : summary.successRate >= 70
                    ? 'Moderate'
                    : summary.totalRequests === 0
                      ? 'No activity'
                      : 'Needs review'}
            </strong>

            <p>
              {loading
                ? 'Analysing request records'
                : `${summary.successRate}% successful requests`}
            </p>
          </div>

          <i
            className={
              summary.successRate >= 90 ||
              summary.totalRequests === 0
                ? s.adminAIHealthGood
                : summary.successRate >= 70
                  ? s.adminAIHealthModerate
                  : s.adminAIHealthWarning
            }
          />
        </aside>
      </section>

      {error && (
        <div className={s.adminAIError}>
          <span>
            <FaCircleExclamation />
          </span>

          <div>
            <strong>AI statistics unavailable</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() => void loadStatistics()}
          >
            Try again
          </button>
        </div>
      )}

      <section className={s.adminAIMetrics}>
        <article>
          <span>
            <FaRobot />
          </span>

          <div>
            <small>Total requests</small>
            <strong>
              {loading
                ? '—'
                : formatNumber(summary.totalRequests)}
            </strong>
            <p>All logged AI operations</p>
          </div>
        </article>

        <article>
          <span>
            <FaBrain />
          </span>

          <div>
            <small>Groq responses</small>
            <strong>
              {loading
                ? '—'
                : formatNumber(summary.groqRequests)}
            </strong>
            <p>{summary.groqShare}% of recorded requests</p>
          </div>
        </article>

        <article>
          <span>
            <FaDatabase />
          </span>

          <div>
            <small>Fallback responses</small>
            <strong>
              {loading
                ? '—'
                : formatNumber(summary.fallbackRequests)}
            </strong>
            <p>Catalogue-generated responses</p>
          </div>
        </article>

        <article>
          <span>
            <FaCircleCheck />
          </span>

          <div>
            <small>Success rate</small>
            <strong>
              {loading ? '—' : `${summary.successRate}%`}
            </strong>
            <p>
              {formatNumber(summary.successfulRequests)} successful
            </p>
          </div>
        </article>

        <article>
          <span>
            <FaClock />
          </span>

          <div>
            <small>Average response</small>
            <strong>
              {loading
                ? '—'
                : formatDuration(summary.averageDuration)}
            </strong>
            <p>Weighted request duration</p>
          </div>
        </article>

        <article>
          <span>
            <FaCircleExclamation />
          </span>

          <div>
            <small>Failed requests</small>
            <strong>
              {loading
                ? '—'
                : formatNumber(summary.failedRequests)}
            </strong>
            <p>Requests requiring review</p>
          </div>
        </article>
      </section>

      <section className={s.adminAIInsights}>
        <article className={s.adminAIUsageCard}>
          <header className={s.adminAIPanelHeader}>
            <div>
              <span className={s.adminAIEyebrow}>
                Source distribution
              </span>

              <h2>Groq and fallback usage</h2>

              <p>
                Compare external AI responses with local catalogue
                fallback activity.
              </p>
            </div>

            <span>
              <FaChartLine />
            </span>
          </header>

          <div className={s.adminAISourceChart}>
            <div className={s.adminAISourceBar}>
              <span
                className={s.adminAISourceGroq}
                style={{
                  width: `${summary.groqShare}%`,
                }}
              />

              <span
                className={s.adminAISourceFallback}
                style={{
                  width: `${Math.max(
                    0,
                    100 - summary.groqShare,
                  )}%`,
                }}
              />
            </div>

            <div className={s.adminAISourceLegend}>
              <div>
                <span className={s.adminAILegendGroq} />

                <div>
                  <small>Groq</small>
                  <strong>
                    {formatNumber(summary.groqRequests)}
                  </strong>
                </div>

                <em>{summary.groqShare}%</em>
              </div>

              <div>
                <span
                  className={s.adminAILegendFallback}
                />

                <div>
                  <small>Fallback</small>
                  <strong>
                    {formatNumber(
                      summary.fallbackRequests,
                    )}
                  </strong>
                </div>

                <em>
                  {summary.totalRequests > 0
                    ? Math.round(
                        (summary.fallbackRequests /
                          summary.totalRequests) *
                          100,
                      )
                    : 0}
                  %
                </em>
              </div>
            </div>
          </div>

          <div className={s.adminAISuccessCard}>
            <div>
              <span>
                <FaCircleCheck />
              </span>

              <div>
                <small>Successful requests</small>
                <strong>
                  {formatNumber(summary.successfulRequests)}
                </strong>
              </div>
            </div>

            <div>
              <span>
                <FaCircleExclamation />
              </span>

              <div>
                <small>Failed requests</small>
                <strong>
                  {formatNumber(summary.failedRequests)}
                </strong>
              </div>
            </div>
          </div>
        </article>

        <article className={s.adminAIPerformanceCard}>
          <header className={s.adminAIPanelHeader}>
            <div>
              <span className={s.adminAIEyebrow}>
                Performance insights
              </span>

              <h2>Response-time overview</h2>

              <p>
                Identify the fastest and slowest recorded AI
                operations.
              </p>
            </div>

            <span>
              <FaBolt />
            </span>
          </header>

          <div className={s.adminAIPerformanceRows}>
            <div>
              <span>
                <FaBolt />
              </span>

              <div>
                <small>Fastest successful request</small>

                <strong>
                  {summary.fastestEndpoint
                    ? formatEndpoint(
                        summary.fastestEndpoint.endpoint,
                      )
                    : 'No data available'}
                </strong>

                <p>
                  {summary.fastestEndpoint
                    ? formatDuration(
                        summary.fastestEndpoint.average_ms,
                      )
                    : 'Waiting for successful requests'}
                </p>
              </div>
            </div>

            <div>
              <span>
                <FaClock />
              </span>

              <div>
                <small>Slowest recorded request</small>

                <strong>
                  {summary.slowestEndpoint
                    ? formatEndpoint(
                        summary.slowestEndpoint.endpoint,
                      )
                    : 'No data available'}
                </strong>

                <p>
                  {summary.slowestEndpoint
                    ? formatDuration(
                        summary.slowestEndpoint.average_ms,
                      )
                    : 'Waiting for request activity'}
                </p>
              </div>
            </div>

            <div>
              <span>
                <FaChartLine />
              </span>

              <div>
                <small>Overall average</small>
                <strong>
                  {formatDuration(summary.averageDuration)}
                </strong>

                <p>
                  Weighted across all logged request groups
                </p>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className={s.adminAIEndpointSection}>
        <div className={s.adminAISectionHeading}>
          <div>
            <span className={s.adminAIEyebrow}>
              Endpoint overview
            </span>

            <h2>AI feature performance</h2>

            <p>
              Review total usage, success rate and response time for
              each AI-enabled feature.
            </p>
          </div>

          <span>
            {endpointSummary.length}{' '}
            {endpointSummary.length === 1
              ? 'endpoint'
              : 'endpoints'}
          </span>
        </div>

        {loading ? (
          <div className={s.adminAIEndpointGrid}>
            {[1, 2, 3].map((item) => (
              <div
                className={s.adminAIEndpointSkeleton}
                key={item}
              />
            ))}
          </div>
        ) : endpointSummary.length > 0 ? (
          <div className={s.adminAIEndpointGrid}>
            {endpointSummary.map((endpoint) => (
              <article key={endpoint.endpoint}>
                <header>
                  <span>
                    <FaRobot />
                  </span>

                  <em>
                    {endpoint.successRate}% successful
                  </em>
                </header>

                <h3>
                  {formatEndpoint(endpoint.endpoint)}
                </h3>

                <div>
                  <span>
                    <small>Requests</small>
                    <strong>
                      {formatNumber(endpoint.requests)}
                    </strong>
                  </span>

                  <span>
                    <small>Average time</small>
                    <strong>
                      {formatDuration(
                        endpoint.averageDuration,
                      )}
                    </strong>
                  </span>
                </div>

                <footer>
                  <span>
                    <i
                      style={{
                        width: `${Math.min(
                          100,
                          endpoint.successRate,
                        )}%`,
                      }}
                    />
                  </span>

                  <small>
                    {endpoint.successRate >= 90
                      ? 'Healthy performance'
                      : endpoint.successRate >= 70
                        ? 'Moderate performance'
                        : 'Requires attention'}
                  </small>
                </footer>
              </article>
            ))}
          </div>
        ) : (
          <div className={s.adminAIEmptyEndpoints}>
            <FaRobot />
            <h2>No endpoint activity yet</h2>

            <p>
              Endpoint performance will appear after users generate
              itineraries or use the travel assistant.
            </p>
          </div>
        )}
      </section>

      <section className={s.adminAIBreakdownSection}>
        <div className={s.adminAIBreakdownHeader}>
          <div>
            <span className={s.adminAIEyebrow}>
              Request log summary
            </span>

            <h2>Detailed AI breakdown</h2>

            <p>
              Filter request groups by endpoint, response source and
              final status.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadStatistics()}
            disabled={loading}
          >
            <FaRotate />
            Refresh
          </button>
        </div>

        <div className={s.adminAIFilters}>
          <label className={s.adminAISearch}>
            <FaMagnifyingGlass />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search endpoint, source or status"
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
            value={sourceFilter}
            onChange={(event) =>
              setSourceFilter(
                event.target.value as SourceFilter,
              )
            }
            aria-label="Filter by AI source"
          >
            <option value="all">All sources</option>
            <option value="groq">Groq</option>
            <option value="fallback">Fallback</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as StatusFilter,
              )
            }
            aria-label="Filter by request status"
          >
            <option value="all">All statuses</option>
            <option value="success">Successful</option>
            <option value="error">Failed or other</option>
          </select>
        </div>

        <div className={s.adminAIResultsHeading}>
          <div>
            <strong>
              {loading
                ? 'Loading request statistics...'
                : `${filteredBreakdown.length} ${
                    filteredBreakdown.length === 1
                      ? 'request group'
                      : 'request groups'
                  } shown`}
            </strong>

            <span>
              Entries are grouped by endpoint, source and result.
            </span>
          </div>

          {hasFilters && (
            <button type="button" onClick={resetFilters}>
              Reset filters
            </button>
          )}
        </div>

        <div className={s.adminAITableCard}>
          <div className={s.adminAITableWrap}>
            <table className={s.adminAITable}>
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Requests</th>
                  <th>Average response</th>
                  <th>Performance</th>
                </tr>
              </thead>

              <tbody>
                {filteredBreakdown.map((item, index) => {
                  const source = normalizeSource(item.source);
                  const status = normalizeStatus(item.status);
                  const duration = Number(
                    item.average_ms || 0,
                  );

                  return (
                    <tr
                      key={`${item.endpoint}-${item.source}-${item.status}-${index}`}
                    >
                      <td>
                        <div className={s.adminAIEndpointName}>
                          <span>
                            <FaRobot />
                          </span>

                          <div>
                            <strong>
                              {formatEndpoint(item.endpoint)}
                            </strong>

                            <small>
                              {item.endpoint || 'Unknown endpoint'}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`${s.adminAISourceBadge} ${
                            source === 'groq'
                              ? s.adminAISourceBadgeGroq
                              : s.adminAISourceBadgeFallback
                          }`}
                        >
                          {source === 'groq' ? (
                            <FaBrain />
                          ) : (
                            <FaDatabase />
                          )}

                          {source}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`${s.adminAIStatusBadge} ${
                            status === 'success'
                              ? s.adminAIStatusSuccess
                              : s.adminAIStatusError
                          }`}
                        >
                          {status === 'success' ? (
                            <FaCircleCheck />
                          ) : (
                            <FaCircleExclamation />
                          )}

                          {status}
                        </span>
                      </td>

                      <td>
                        <strong
                          className={s.adminAIRequestCount}
                        >
                          {formatNumber(item.count)}
                        </strong>
                      </td>

                      <td>
                        <span className={s.adminAIDuration}>
                          <FaClock />
                          {formatDuration(item.average_ms)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`${s.adminAIPerformanceBadge} ${
                            duration === 0
                              ? s.adminAIPerformanceUnknown
                              : duration <= 1500
                                ? s.adminAIPerformanceFast
                                : duration <= 4000
                                  ? s.adminAIPerformanceMedium
                                  : s.adminAIPerformanceSlow
                          }`}
                        >
                          {duration === 0
                            ? 'Unknown'
                            : duration <= 1500
                              ? 'Fast'
                              : duration <= 4000
                                ? 'Moderate'
                                : 'Slow'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {loading && (
            <div className={s.adminAILoading}>
              <span />
              <span />
              <span />
              <span />
            </div>
          )}

          {!loading && filteredBreakdown.length === 0 && (
            <div className={s.adminAIEmptyTable}>
              <span>
                <FaRobot />
              </span>

              <h2>
                {data?.aiBreakdown.length
                  ? 'No request groups match your filters'
                  : 'No AI statistics recorded yet'}
              </h2>

              <p>
                {data?.aiBreakdown.length
                  ? 'Try another search term or reset the source and status filters.'
                  : 'Statistics will appear after users generate itineraries or interact with the AI assistant.'}
              </p>

              {data?.aiBreakdown.length ? (
                <button
                  type="button"
                  onClick={resetFilters}
                >
                  Reset filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void loadStatistics()}
                >
                  <FaRotate />
                  Refresh statistics
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}