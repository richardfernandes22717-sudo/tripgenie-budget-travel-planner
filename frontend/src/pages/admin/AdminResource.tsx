import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import axios from 'axios';
import type { IconType } from 'react-icons';
import {
  FaArrowLeft,
  FaArrowRight,
  FaBed,
  FaBus,
  FaCircleCheck,
  FaCircleExclamation,
  FaDatabase,
  FaImage,
  FaLandmark,
  FaMagnifyingGlass,
  FaMapLocationDot,
  FaPen,
  FaPlus,
  FaRoute,
  FaStar,
  FaStore,
  FaTicket,
  FaTrash,
  FaUpload,
  FaXmark,
} from 'react-icons/fa6';
import { useParams } from 'react-router-dom';

import api, { imageUrl } from '../../api/client';
import ConfirmModal from '../../components/ConfirmModal';
import s from '../../components/ui.module.css';

type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

type AdminRecord = Record<string, unknown> & {
  id?: number;
};

type ResourceConfig = {
  title: string;
  singular: string;
  description: string;
  icon: IconType;
  fields: string[];
  tableColumns: string[];
  monitorOnly?: boolean;
};

type Message = {
  type: 'success' | 'error';
  text: string;
} | null;

const resourceConfigs: Record<string, ResourceConfig> = {
  destinations: {
    title: 'Destinations',
    singular: 'destination',
    description:
      'Manage locations, travel budgets, seasons and destination information.',
    icon: FaMapLocationDot,
    fields: [
      'name',
      'city',
      'state',
      'country',
      'description',
      'category',
      'climate',
      'best_season',
      'minimum_budget',
      'average_daily_cost',
      'image',
      'latitude',
      'longitude',
      'rating',
      'status',
    ],
    tableColumns: [
      'name',
      'city',
      'state',
      'country',
      'minimum_budget',
      'rating',
      'status',
    ],
  },

  hotels: {
    title: 'Hotels',
    singular: 'hotel',
    description:
      'Maintain accommodation prices, room details, amenities and availability.',
    icon: FaBed,
    fields: [
      'destination_id',
      'name',
      'description',
      'location',
      'price_per_night',
      'rating',
      'hotel_type',
      'room_type',
      'maximum_guests',
      'amenities',
      'image',
      'contact',
      'availability_status',
    ],
    tableColumns: [
      'name',
      'destination_id',
      'location',
      'price_per_night',
      'rating',
      'room_type',
      'availability_status',
    ],
  },

  restaurants: {
    title: 'Restaurants',
    singular: 'restaurant',
    description:
      'Update cuisines, dining costs, dietary support and opening hours.',
    icon: FaStore,
    fields: [
      'destination_id',
      'name',
      'description',
      'location',
      'cuisine',
      'average_cost_per_person',
      'rating',
      'dietary_options',
      'opening_time',
      'closing_time',
      'image',
      'status',
    ],
    tableColumns: [
      'name',
      'destination_id',
      'location',
      'cuisine',
      'average_cost_per_person',
      'rating',
      'status',
    ],
  },

  attractions: {
    title: 'Attractions',
    singular: 'attraction',
    description:
      'Control attraction details, entry fees, visit times and categories.',
    icon: FaLandmark,
    fields: [
      'destination_id',
      'name',
      'description',
      'location',
      'category',
      'entry_fee',
      'recommended_duration',
      'opening_time',
      'closing_time',
      'best_visit_time',
      'rating',
      'image',
      'latitude',
      'longitude',
      'status',
    ],
    tableColumns: [
      'name',
      'destination_id',
      'location',
      'category',
      'entry_fee',
      'rating',
      'status',
    ],
  },

  transportation: {
    title: 'Transportation',
    singular: 'transport option',
    description:
      'Manage travel routes, providers, durations and estimated costs.',
    icon: FaBus,
    fields: [
      'origin',
      'destination_id',
      'transport_type',
      'provider',
      'estimated_cost',
      'estimated_duration',
      'description',
      'status',
    ],
    tableColumns: [
      'origin',
      'destination_id',
      'transport_type',
      'provider',
      'estimated_cost',
      'estimated_duration',
      'status',
    ],
  },

  travel_packages: {
    title: 'Travel packages',
    singular: 'travel package',
    description:
      'Create and maintain packaged journeys, prices and inclusions.',
    icon: FaRoute,
    fields: [
      'destination_id',
      'name',
      'description',
      'days',
      'base_price',
      'inclusions',
      'status',
    ],
    tableColumns: [
      'name',
      'destination_id',
      'days',
      'base_price',
      'status',
    ],
  },

  bookings: {
    title: 'Bookings',
    singular: 'booking',
    description:
      'Monitor booking references, amounts, dates and fulfilment statuses.',
    icon: FaTicket,
    fields: [
      'booking_type',
      'provider_reference',
      'booking_date',
      'amount',
      'currency',
      'status',
      'notes',
    ],
    tableColumns: [
      'booking_type',
      'provider_reference',
      'booking_date',
      'amount',
      'currency',
      'status',
    ],
    monitorOnly: true,
  },

  reviews: {
    title: 'Reviews',
    singular: 'review',
    description:
      'Moderate user ratings, comments and publication statuses.',
    icon: FaStar,
    fields: [
      'rating',
      'title',
      'comment',
      'status',
    ],
    tableColumns: [
      'title',
      'rating',
      'comment',
      'status',
    ],
    monitorOnly: true,
  },

  trips: {
    title: 'Trip monitoring',
    singular: 'trip',
    description:
      'Review saved travel plans, dates, travellers and trip statuses.',
    icon: FaRoute,
    fields: [
      'title',
      'start_date',
      'end_date',
      'traveller_count',
      'status',
    ],
    tableColumns: [
      'title',
      'start_date',
      'end_date',
      'traveller_count',
      'status',
    ],
    monitorOnly: true,
  },
};

const numericFields = new Set([
  'destination_id',
  'price_per_night',
  'rating',
  'maximum_guests',
  'minimum_budget',
  'average_daily_cost',
  'latitude',
  'longitude',
  'entry_fee',
  'recommended_duration',
  'estimated_cost',
  'estimated_duration',
  'days',
  'base_price',
  'amount',
  'traveller_count',
]);

const currencyFields = new Set([
  'minimum_budget',
  'average_daily_cost',
  'price_per_night',
  'average_cost_per_person',
  'entry_fee',
  'estimated_cost',
  'base_price',
  'amount',
]);

const textareaFields = new Set([
  'description',
  'amenities',
  'dietary_options',
  'inclusions',
  'comment',
  'notes',
]);

const dateFields = new Set([
  'booking_date',
  'start_date',
  'end_date',
]);

const timeFields = new Set([
  'opening_time',
  'closing_time',
  'best_visit_time',
]);

const statusFields = new Set([
  'status',
  'availability_status',
]);

const formatLabel = (value: string) =>
  value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatMoney = (value: unknown) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;

const formatDate = (value: unknown) => {
  if (!value) {
    return '—';
  }

  const normalizedValue = String(value).slice(0, 10);
  const parsedDate = new Date(`${normalizedValue}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return normalizedValue;
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate);
};

const formatCellValue = (
  field: string,
  value: unknown,
) => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (currencyFields.has(field)) {
    return formatMoney(value);
  }

  if (dateFields.has(field)) {
    return formatDate(value);
  }

  if (field === 'rating') {
    return `${Number(value).toFixed(1)} / 5`;
  }

  if (field === 'estimated_duration') {
    return `${value} min`;
  }

  return String(value);
};

const getInputType = (field: string) => {
  if (dateFields.has(field)) {
    return 'date';
  }

  if (timeFields.has(field)) {
    return 'time';
  }

  if (numericFields.has(field)) {
    return 'number';
  }

  if (field === 'image') {
    return 'url';
  }

  return 'text';
};

const getInputStep = (field: string) => {
  if (
    field === 'rating' ||
    field === 'latitude' ||
    field === 'longitude'
  ) {
    return '0.01';
  }

  return '1';
};

const getStatusClass = (value: unknown) => {
  const normalizedValue = String(value || '').toLowerCase();

  if (
    normalizedValue === 'active' ||
    normalizedValue === 'available' ||
    normalizedValue === 'approved' ||
    normalizedValue === 'confirmed' ||
    normalizedValue === 'completed'
  ) {
    return s.adminResourceStatusSuccess;
  }

  if (
    normalizedValue === 'inactive' ||
    normalizedValue === 'unavailable' ||
    normalizedValue === 'rejected' ||
    normalizedValue === 'cancelled' ||
    normalizedValue === 'suspended'
  ) {
    return s.adminResourceStatusDanger;
  }

  return s.adminResourceStatusPending;
};

export default function AdminResource() {
  const { resource = 'destinations' } = useParams();

  const config =
    resourceConfigs[resource] || resourceConfigs.destinations;

  const ResourceIcon = config.icon;

  const [items, setItems] = useState<AdminRecord[]>([]);
  const [edit, setEdit] = useState<AdminRecord | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [removeId, setRemoveId] = useState<number | null>(
    null,
  );

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  const emptyRecord = useMemo(
    () =>
      Object.fromEntries(
        config.fields.map((field) => [field, '']),
      ),
    [resource],
  );

  const loadRecords = useCallback(
    async (nextPage: number, nextSearch: string) => {
      setLoading(true);
      setMessage(null);

      try {
        const response = await api.get(`/admin/${resource}`, {
          params: {
            page: nextPage,
            search: nextSearch.trim() || undefined,
          },
        });

        const responseData = response.data.data || {};

        setItems(
          Array.isArray(responseData.items)
            ? responseData.items
            : [],
        );

        const receivedPagination =
          responseData.pagination || {};

        setPagination({
          page: Number(receivedPagination.page || nextPage),
          limit: Number(receivedPagination.limit || 20),
          total: Number(receivedPagination.total || 0),
          pages: Math.max(
            1,
            Number(receivedPagination.pages || 1),
          ),
        });
      } catch (requestError: unknown) {
        const requestMessage = axios.isAxiosError(requestError)
          ? requestError.response?.data?.message
          : null;

        setItems([]);

        setMessage({
          type: 'error',
          text:
            requestMessage ||
            `${config.title} could not be loaded.`,
        });
      } finally {
        setLoading(false);
      }
    },
    [resource, config.title],
  );

  useEffect(() => {
    setEdit(null);
    setFile(null);
    setRemoveId(null);
    setSearch('');
    setPage(1);

    void loadRecords(1, '');
  }, [resource, loadRecords]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();

    setPage(1);
    void loadRecords(1, search);
  };

  const clearSearch = () => {
    setSearch('');
    setPage(1);
    void loadRecords(1, '');
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
    void loadRecords(nextPage, search);
  };

  const openCreateModal = () => {
    setEdit({
      ...emptyRecord,
    });

    setFile(null);
    setMessage(null);
  };

  const openEditModal = (record: AdminRecord) => {
    setEdit({
      ...record,
    });

    setFile(null);
    setMessage(null);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setEdit(null);
    setFile(null);
  };

  const updateField = (field: string, value: string) => {
    setEdit((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current,
    );
  };

  const submitRecord = async (event: FormEvent) => {
    event.preventDefault();

    if (!edit) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      let payload: Record<string, unknown> = {};

      for (const field of config.fields) {
        const value = edit[field];

        if (
          value === undefined ||
          value === null ||
          value === ''
        ) {
          continue;
        }

        payload[field] = numericFields.has(field)
          ? Number(value)
          : value;
      }

      let requestPayload: Record<string, unknown> | FormData =
        payload;

      if (config.fields.includes('image') && file) {
        const formData = new FormData();

        Object.entries(payload).forEach(([key, value]) => {
          formData.append(key, String(value));
        });

        formData.append('image', file);
        requestPayload = formData;
      }

      const recordId = Number(edit.id || 0);

      if (recordId) {
        await api.put(
          `/admin/${resource}/${recordId}`,
          requestPayload,
        );
      } else {
        await api.post(
          `/admin/${resource}`,
          requestPayload,
        );
      }

      setEdit(null);
      setFile(null);

      setMessage({
        type: 'success',
        text: recordId
          ? `${config.singular} updated successfully.`
          : `${config.singular} created successfully.`,
      });

      await loadRecords(page, search);
    } catch (requestError: unknown) {
      const requestMessage = axios.isAxiosError(requestError)
        ? requestError.response?.data?.message
        : null;

      setMessage({
        type: 'error',
        text:
          requestMessage ||
          `The ${config.singular} could not be saved.`,
      });
    } finally {
      setSaving(false);
    }
  };

  const removeRecord = async () => {
    if (!removeId) {
      return;
    }

    setDeleting(true);
    setMessage(null);

    try {
      await api.delete(`/admin/${resource}/${removeId}`);

      setRemoveId(null);

      const nextPage =
        items.length === 1 && page > 1 ? page - 1 : page;

      setPage(nextPage);

      await loadRecords(nextPage, search);

      setMessage({
        type: 'success',
        text: `${config.singular} deleted successfully.`,
      });
    } catch (requestError: unknown) {
      const requestMessage = axios.isAxiosError(requestError)
        ? requestError.response?.data?.message
        : null;

      setMessage({
        type: 'error',
        text:
          requestMessage ||
          `The ${config.singular} could not be deleted.`,
      });
    } finally {
      setDeleting(false);
    }
  };

  const currentRangeStart =
    pagination.total === 0
      ? 0
      : (pagination.page - 1) * pagination.limit + 1;

  const currentRangeEnd = Math.min(
    pagination.page * pagination.limit,
    pagination.total,
  );

  return (
    <div className={s.adminResourcePage}>
      <section className={s.adminResourceHero}>
        <div className={s.adminResourceHeroCopy}>
          <span className={s.adminResourceEyebrow}>
            <FaDatabase />
            {config.monitorOnly
              ? 'Operations monitoring'
              : 'Database management'}
          </span>

          <h1>{config.title}</h1>

          <p>{config.description}</p>

          <div className={s.adminResourceHeroMeta}>
            <span>
              <ResourceIcon />
              {pagination.total.toLocaleString('en-IN')}{' '}
              {pagination.total === 1 ? 'record' : 'records'}
            </span>

            <span>
              <FaDatabase />
              MySQL-backed management
            </span>
          </div>
        </div>

        <aside className={s.adminResourceHeroCard}>
          <span>
            <ResourceIcon />
          </span>

          <div>
            <small>Current collection</small>

            <strong>
              {loading
                ? '—'
                : pagination.total.toLocaleString('en-IN')}
            </strong>

            <p>
              {config.monitorOnly
                ? 'Review and update existing records'
                : 'Create, edit and remove records'}
            </p>
          </div>
        </aside>
      </section>

      {message && (
        <div
          className={`${s.adminResourceMessage} ${
            message.type === 'success'
              ? s.adminResourceMessageSuccess
              : s.adminResourceMessageError
          }`}
        >
          {message.type === 'success' ? (
            <FaCircleCheck />
          ) : (
            <FaCircleExclamation />
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

      <section className={s.adminResourceToolbar}>
        <form
          className={s.adminResourceSearchForm}
          onSubmit={submitSearch}
        >
          <div className={s.adminResourceSearch}>
            <FaMagnifyingGlass />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder={`Search ${config.title.toLowerCase()}`}
            />

            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={clearSearch}
              >
                <FaXmark />
              </button>
            )}
          </div>

          <button
            type="submit"
            className={s.adminResourceSearchButton}
            disabled={loading}
          >
            <FaMagnifyingGlass />
            Search
          </button>
        </form>

        {!config.monitorOnly && (
          <button
            type="button"
            className={s.adminResourceAddButton}
            onClick={openCreateModal}
          >
            <FaPlus />
            Add {config.singular}
          </button>
        )}
      </section>

      <div className={s.adminResourceResultsHeader}>
        <div>
          <strong>
            {loading
              ? `Loading ${config.title.toLowerCase()}...`
              : pagination.total === 0
                ? 'No matching records'
                : `Showing ${currentRangeStart}–${currentRangeEnd} of ${pagination.total}`}
          </strong>

          <span>
            Select edit to update a record or delete to remove it
            permanently.
          </span>
        </div>

        {search && (
          <button type="button" onClick={clearSearch}>
            Clear search
          </button>
        )}
      </div>

      <section className={s.adminResourceTableCard}>
        <div className={s.adminResourceTableWrap}>
          <table className={s.adminResourceTable}>
            <thead>
              <tr>
                <th>ID</th>

                {config.tableColumns.map((column) => (
                  <th key={column}>{formatLabel(column)}</th>
                ))}

                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {items.map((record) => (
                <tr key={Number(record.id)}>
                  <td>
                    <span className={s.adminResourceId}>
                      #{String(record.id)}
                    </span>
                  </td>

                  {config.tableColumns.map((column) => {
                    const value = record[column];

                    return (
                      <td key={column}>
                        {statusFields.has(column) ? (
                          <span
                            className={`${s.adminResourceStatus} ${getStatusClass(
                              value,
                            )}`}
                          >
                            {formatCellValue(column, value)}
                          </span>
                        ) : column === 'image' ? (
                          <img
                            className={s.adminResourceThumbnail}
                            src={imageUrl(String(value || ''))}
                            alt=""
                            onError={(event) => {
                              event.currentTarget.src =
                                '/fallback.svg';
                            }}
                          />
                        ) : (
                          <span
                            className={
                              textareaFields.has(column)
                                ? s.adminResourceLongText
                                : ''
                            }
                            title={String(value || '')}
                          >
                            {formatCellValue(column, value)}
                          </span>
                        )}
                      </td>
                    );
                  })}

                  <td>
                    <div className={s.adminResourceActions}>
                      <button
                        type="button"
                        aria-label={`Edit ${config.singular}`}
                        onClick={() => openEditModal(record)}
                      >
                        <FaPen />
                        Edit
                      </button>

                      <button
                        type="button"
                        aria-label={`Delete ${config.singular}`}
                        onClick={() =>
                          setRemoveId(Number(record.id))
                        }
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className={s.adminResourceLoading}>
            <span />
            <span />
            <span />
            <span />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className={s.adminResourceEmpty}>
            <span>
              <ResourceIcon />
            </span>

            <h2>No records found</h2>

            <p>
              {search
                ? `No ${config.title.toLowerCase()} match the current search.`
                : `No ${config.title.toLowerCase()} have been added yet.`}
            </p>

            {search ? (
              <button type="button" onClick={clearSearch}>
                Clear search
              </button>
            ) : (
              !config.monitorOnly && (
                <button
                  type="button"
                  onClick={openCreateModal}
                >
                  <FaPlus />
                  Add the first {config.singular}
                </button>
              )
            )}
          </div>
        )}
      </section>

      <nav
        className={s.adminResourcePagination}
        aria-label={`${config.title} pagination`}
      >
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => changePage(page - 1)}
        >
          <FaArrowLeft />
          Previous
        </button>

        <div>
          <span>Page</span>
          <strong>{pagination.page}</strong>
          <span>of {pagination.pages}</span>
        </div>

        <button
          type="button"
          disabled={page >= pagination.pages || loading}
          onClick={() => changePage(page + 1)}
        >
          Next
          <FaArrowRight />
        </button>
      </nav>

      {edit && (
        <div
          className={s.adminResourceModalBackdrop}
          role="presentation"
        >
          <form
            className={s.adminResourceModal}
            onSubmit={submitRecord}
          >
            <header className={s.adminResourceModalHeader}>
              <div>
                <span className={s.adminResourceEyebrow}>
                  {edit.id ? 'Update record' : 'Create record'}
                </span>

                <h2>
                  {edit.id
                    ? `Edit ${config.singular}`
                    : `Add ${config.singular}`}
                </h2>

                <p>
                  Complete the fields below and save the information
                  to MySQL.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close editor"
                onClick={closeModal}
                disabled={saving}
              >
                <FaXmark />
              </button>
            </header>

            <div className={s.adminResourceFormGrid}>
              {config.fields.map((field) => {
                const value = String(edit[field] ?? '');
                const isFullWidth =
                  textareaFields.has(field) ||
                  field === 'image';

                return (
                  <label
                    className={`${s.adminResourceField} ${
                      isFullWidth
                        ? s.adminResourceFieldFull
                        : ''
                    }`}
                    key={field}
                  >
                    <span>{formatLabel(field)}</span>

                    {textareaFields.has(field) ? (
                      <textarea
                        rows={5}
                        value={value}
                        onChange={(event) =>
                          updateField(
                            field,
                            event.target.value,
                          )
                        }
                        placeholder={`Enter ${formatLabel(
                          field,
                        ).toLowerCase()}`}
                      />
                    ) : (
                      <input
                        type={getInputType(field)}
                        step={getInputStep(field)}
                        min={
                          numericFields.has(field)
                            ? '0'
                            : undefined
                        }
                        value={
                          dateFields.has(field)
                            ? value.slice(0, 10)
                            : timeFields.has(field)
                              ? value.slice(0, 5)
                              : value
                        }
                        onChange={(event) =>
                          updateField(
                            field,
                            event.target.value,
                          )
                        }
                        placeholder={`Enter ${formatLabel(
                          field,
                        ).toLowerCase()}`}
                      />
                    )}

                    {field === 'image' && (
                      <small>
                        Enter an external image URL or upload a local
                        image below.
                      </small>
                    )}
                  </label>
                );
              })}

              {config.fields.includes('image') && (
                <label
                  className={`${s.adminResourceField} ${s.adminResourceFieldFull}`}
                >
                  <span>Upload image</span>

                  <div className={s.adminResourceFileInput}>
                    <FaUpload />

                    <div>
                      <strong>
                        {file
                          ? file.name
                          : 'Choose JPG, PNG or WebP'}
                      </strong>

                      <small>
                        Maximum upload size depends on the backend
                        Multer configuration.
                      </small>
                    </div>

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) =>
                        setFile(
                          event.target.files?.[0] || null,
                        )
                      }
                    />
                  </div>

                  {file && (
                    <div className={s.adminResourceFileSelected}>
                      <FaImage />
                      {file.name}
                    </div>
                  )}
                </label>
              )}
            </div>

            <footer className={s.adminResourceModalActions}>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
              >
                Cancel
              </button>

              <button type="submit" disabled={saving}>
                <FaCircleCheck />

                {saving
                  ? 'Saving to MySQL...'
                  : edit.id
                    ? 'Save changes'
                    : `Create ${config.singular}`}
              </button>
            </footer>
          </form>
        </div>
      )}

      {removeId && (
        <ConfirmModal
          title={`Delete ${config.singular}?`}
          body={`This permanently removes the selected ${config.singular}. Related records may also be affected by database cascade rules.`}
          onClose={() => {
            if (!deleting) {
              setRemoveId(null);
            }
          }}
          onConfirm={removeRecord}
        />
      )}
    </div>
  );
}