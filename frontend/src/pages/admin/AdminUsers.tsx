import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import axios from 'axios';
import {
  FaCalendarDays,
  FaCircleCheck,
  FaCircleExclamation,
  FaEnvelope,
  FaMagnifyingGlass,
  FaRotate,
  FaShieldHalved,
  FaUser,
  FaUserCheck,
  FaUsers,
  FaXmark,
} from 'react-icons/fa6';

import api from '../../api/client';
import ConfirmModal from '../../components/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import s from '../../components/ui.module.css';

type UserRole = 'user' | 'admin';

type UserStatus = 'active' | 'inactive' | 'suspended';

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  profile_image?: string;
  created_at?: string;
};

type PendingChange = {
  user: AdminUser;
  field: 'role' | 'status';
  value: UserRole | UserStatus;
} | null;

type Message = {
  type: 'success' | 'error';
  text: string;
} | null;

const formatDate = (value?: string) => {
  if (!value) {
    return 'Unknown date';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value.slice(0, 10);
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate);
};

const getInitials = (name?: string) =>
  (name || 'User')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export default function AdminUsers() {
  const { user: currentUser } = useAuth();

  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(
    null,
  );

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [pendingChange, setPendingChange] =
    useState<PendingChange>(null);

  const [message, setMessage] = useState<Message>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await api.get('/admin/users');

      const responseData = response.data.data;

      setItems(Array.isArray(responseData) ? responseData : []);
    } catch (requestError: unknown) {
      const requestMessage = axios.isAxiosError(requestError)
        ? requestError.response?.data?.message
        : null;

      setMessage({
        type: 'error',
        text:
          requestMessage ||
          'User accounts could not be loaded.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const summary = useMemo(() => {
    const administrators = items.filter(
      (item) => item.role === 'admin',
    ).length;

    const active = items.filter(
      (item) => item.status === 'active',
    ).length;

    const suspended = items.filter(
      (item) => item.status === 'suspended',
    ).length;

    return {
      total: items.length,
      administrators,
      active,
      suspended,
    };
  }, [items]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.email.toLowerCase().includes(normalizedSearch) ||
        item.phone?.toLowerCase().includes(normalizedSearch);

      const matchesRole =
        roleFilter === 'all' || item.role === roleFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        item.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [items, search, roleFilter, statusFilter]);

  const requestChange = (
    user: AdminUser,
    field: 'role' | 'status',
    value: string,
  ) => {
    if (user[field] === value) {
      return;
    }

    setPendingChange({
      user,
      field,
      value: value as UserRole | UserStatus,
    });
  };

  const confirmChange = async () => {
    if (!pendingChange) {
      return;
    }

    const { user, field, value } = pendingChange;

    setUpdatingId(user.id);
    setMessage(null);

    try {
      await api.put(`/admin/users/${user.id}`, {
        [field]: value,
      });

      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === user.id
            ? {
                ...item,
                [field]: value,
              }
            : item,
        ),
      );

      setMessage({
        type: 'success',
        text:
          field === 'role'
            ? `${user.name}'s role was changed to ${value}.`
            : `${user.name}'s account status was changed to ${value}.`,
      });

      setPendingChange(null);
    } catch (requestError: unknown) {
      const requestMessage = axios.isAxiosError(requestError)
        ? requestError.response?.data?.message
        : null;

      setMessage({
        type: 'error',
        text:
          requestMessage ||
          'The user account could not be updated.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  const hasFilters =
    Boolean(search) ||
    roleFilter !== 'all' ||
    statusFilter !== 'all';

  const getChangeTitle = () => {
    if (!pendingChange) {
      return '';
    }

    return pendingChange.field === 'role'
      ? 'Change user role?'
      : 'Change account status?';
  };

  const getChangeBody = () => {
    if (!pendingChange) {
      return '';
    }

    const isCurrentAccount =
      pendingChange.user.id === currentUser?.id;

    const baseMessage =
      pendingChange.field === 'role'
        ? `${pendingChange.user.name} will be assigned the "${pendingChange.value}" role.`
        : `${pendingChange.user.name}'s account status will be changed to "${pendingChange.value}".`;

    return isCurrentAccount
      ? `${baseMessage} You are changing your own administrator account, which may affect your current access.`
      : baseMessage;
  };

  return (
    <div className={s.adminUsersPage}>
      <section className={s.adminUsersHero}>
        <div>
          <span className={s.adminUsersEyebrow}>
            <FaShieldHalved />
            Access control
          </span>

          <h1>Manage user access and account safety.</h1>

          <p>
            Review registered accounts, assign administrator access
            and control whether users can continue using TripGenie.
          </p>
        </div>

        <aside className={s.adminUsersHeroCard}>
          <span>
            <FaUsers />
          </span>

          <div>
            <small>Registered accounts</small>

            <strong>{loading ? '—' : summary.total}</strong>

            <p>
              {loading
                ? 'Checking user records'
                : `${summary.active} accounts currently active`}
            </p>
          </div>
        </aside>
      </section>

      {message && (
        <div
          className={`${s.adminUsersMessage} ${
            message.type === 'success'
              ? s.adminUsersMessageSuccess
              : s.adminUsersMessageError
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

      <section className={s.adminUsersMetrics}>
        <article>
          <span>
            <FaUsers />
          </span>

          <div>
            <small>Total accounts</small>
            <strong>{loading ? '—' : summary.total}</strong>
            <p>All registered TripGenie users</p>
          </div>
        </article>

        <article>
          <span>
            <FaShieldHalved />
          </span>

          <div>
            <small>Administrators</small>
            <strong>
              {loading ? '—' : summary.administrators}
            </strong>
            <p>Accounts with management access</p>
          </div>
        </article>

        <article>
          <span>
            <FaUserCheck />
          </span>

          <div>
            <small>Active accounts</small>
            <strong>{loading ? '—' : summary.active}</strong>
            <p>Users allowed to access the platform</p>
          </div>
        </article>

        <article>
          <span>
            <FaCircleExclamation />
          </span>

          <div>
            <small>Suspended accounts</small>
            <strong>
              {loading ? '—' : summary.suspended}
            </strong>
            <p>Accounts currently restricted</p>
          </div>
        </article>
      </section>

      <section className={s.adminUsersToolbar}>
        <div className={s.adminUsersToolbarHeading}>
          <span>
            <FaMagnifyingGlass />
          </span>

          <div>
            <h2>Find a user account</h2>
            <p>
              Search by name, email address or phone number.
            </p>
          </div>
        </div>

        <div className={s.adminUsersFilters}>
          <label className={s.adminUsersSearch}>
            <FaMagnifyingGlass />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search users"
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
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(event.target.value)
            }
            aria-label="Filter by role"
          >
            <option value="all">All roles</option>
            <option value="user">Users</option>
            <option value="admin">Administrators</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          <button
            type="button"
            className={s.adminUsersRefreshButton}
            onClick={() => void loadUsers()}
            disabled={loading}
          >
            <FaRotate />
            Refresh
          </button>
        </div>
      </section>

      <div className={s.adminUsersResultsHeader}>
        <div>
          <strong>
            {loading
              ? 'Loading user accounts...'
              : `${filteredUsers.length} ${
                  filteredUsers.length === 1
                    ? 'account'
                    : 'accounts'
                } shown`}
          </strong>

          <span>
            Role and status changes are applied immediately after
            confirmation.
          </span>
        </div>

        {hasFilters && (
          <button type="button" onClick={resetFilters}>
            Reset filters
          </button>
        )}
      </div>

      <section className={s.adminUsersTableCard}>
        <div className={s.adminUsersTableWrap}>
          <table className={s.adminUsersTable}>
            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((item) => {
                const isCurrentAccount =
                  item.id === currentUser?.id;

                return (
                  <tr key={item.id}>
                    <td>
                      <div className={s.adminUsersIdentity}>
                        <span>
                          {getInitials(item.name)}
                        </span>

                        <div>
                          <strong>{item.name}</strong>

                          <small>
                            User ID #{item.id}
                            {isCurrentAccount
                              ? ' · Your account'
                              : ''}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className={s.adminUsersContact}>
                        <span>
                          <FaEnvelope />
                          {item.email}
                        </span>

                        {item.phone && (
                          <small>{item.phone}</small>
                        )}
                      </div>
                    </td>

                    <td>
                      <select
                        className={s.adminUsersSelect}
                        value={item.role}
                        disabled={updatingId === item.id}
                        onChange={(event) =>
                          requestChange(
                            item,
                            'role',
                            event.target.value,
                          )
                        }
                      >
                        <option value="user">User</option>
                        <option value="admin">
                          Administrator
                        </option>
                      </select>
                    </td>

                    <td>
                      <div
                        className={s.adminUsersStatusControl}
                      >
                        <span
                          className={`${s.adminUsersStatusDot} ${
                            item.status === 'active'
                              ? s.adminUsersStatusActive
                              : item.status === 'suspended'
                                ? s.adminUsersStatusSuspended
                                : s.adminUsersStatusInactive
                          }`}
                        />

                        <select
                          className={s.adminUsersSelect}
                          value={item.status}
                          disabled={updatingId === item.id}
                          onChange={(event) =>
                            requestChange(
                              item,
                              'status',
                              event.target.value,
                            )
                          }
                        >
                          <option value="active">Active</option>
                          <option value="inactive">
                            Inactive
                          </option>
                          <option value="suspended">
                            Suspended
                          </option>
                        </select>
                      </div>
                    </td>

                    <td>
                      <span className={s.adminUsersJoined}>
                        <FaCalendarDays />
                        {formatDate(item.created_at)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className={s.adminUsersLoading}>
            <span />
            <span />
            <span />
          </div>
        )}

        {!loading && filteredUsers.length === 0 && (
          <div className={s.adminUsersEmpty}>
            <span>
              <FaUser />
            </span>

            <h2>
              {items.length === 0
                ? 'No user accounts found'
                : 'No users match your filters'}
            </h2>

            <p>
              {items.length === 0
                ? 'Registered users will appear here when accounts are created.'
                : 'Try another search term or reset the selected filters.'}
            </p>

            {items.length > 0 && (
              <button type="button" onClick={resetFilters}>
                Show all users
              </button>
            )}
          </div>
        )}
      </section>

      {pendingChange && (
        <ConfirmModal
          title={getChangeTitle()}
          body={getChangeBody()}
          onClose={() => setPendingChange(null)}
          onConfirm={confirmChange}
        />
      )}
    </div>
  );
}