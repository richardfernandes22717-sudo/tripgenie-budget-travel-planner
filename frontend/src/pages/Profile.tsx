import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import axios from 'axios';
import {
  FaArrowRight,
  FaCamera,
  FaCircleCheck,
  FaCircleExclamation,
  FaEnvelope,
  FaGear,
  FaHeart,
  FaImage,
  FaLock,
  FaPhone,
  FaShieldHalved,
  FaUser,
} from 'react-icons/fa6';
import { Link } from 'react-router-dom';

import api, { imageUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import s from '../components/ui.module.css';

type ProfileMessage = {
  type: 'success' | 'error';
  text: string;
} | null;

export default function Profile() {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(
    imageUrl(user?.profile_image),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] =
    useState<ProfileMessage>(null);

  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');

    if (!file) {
      setPreviewUrl(imageUrl(user?.profile_image));
    }
  }, [user, file]);

  useEffect(
    () => () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [previewUrl],
  );

  const initials = useMemo(() => {
    const parts = (user?.name || 'Traveller')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }, [user?.name]);

  const isDirty =
    name.trim() !== (user?.name || '').trim() ||
    phone.trim() !== (user?.phone || '').trim() ||
    file !== null;

  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0] || null;

    if (!selectedFile) return;

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setMessage({
        type: 'error',
        text: 'Choose a JPG, PNG or WebP image.',
      });

      event.target.value = '';
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setMessage({
        type: 'error',
        text: 'The selected image must be smaller than 5 MB.',
      });

      event.target.value = '';
      return;
    }

    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setMessage(null);
  };

  const submitProfile = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (cleanName.length < 2 || cleanName.length > 100) {
      setMessage({
        type: 'error',
        text: 'Your name must contain between 2 and 100 characters.',
      });

      return;
    }

    if (
      cleanPhone &&
      (cleanPhone.length < 7 || cleanPhone.length > 20)
    ) {
      setMessage({
        type: 'error',
        text: 'Your phone number must contain between 7 and 20 characters.',
      });

      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();

      formData.append('name', cleanName);
      formData.append('phone', cleanPhone);

      if (file) {
        formData.append('profile_image', file);
      }

      await api.put('/auth/profile', formData);

      await refreshUser();

      setFile(null);

      setMessage({
        type: 'success',
        text: 'Your profile was updated successfully.',
      });
    } catch (requestError: unknown) {
      const requestMessage = axios.isAxiosError(requestError)
        ? requestError.response?.data?.message
        : null;

      setMessage({
        type: 'error',
        text: requestMessage || 'Your profile could not be updated.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={s.profilePage}>
      <section className={s.profileHero}>
        <div className={s.profileHeroCopy}>
          <span className={s.profileEyebrow}>
            Your TripGenie account
          </span>

          <h1>A profile that travels with you.</h1>

          <p>
            Keep your personal information accurate and manage how
            your identity appears throughout TripGenie.
          </p>
        </div>

        <div className={s.profileHeroIdentity}>
          <div className={s.profileHeroAvatar}>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={user?.name || 'Profile'}
                onError={(event) => {
                  event.currentTarget.src = '/fallback.svg';
                }}
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          <div>
            <span
              className={`${s.profileStatus} ${
                user?.status === 'active'
                  ? s.profileStatusActive
                  : s.profileStatusInactive
              }`}
            >
              {user?.status || 'Active'}
            </span>

            <h2>{user?.name || 'Traveller'}</h2>
            <p>{user?.email}</p>
          </div>
        </div>
      </section>

      {message && (
        <div
          className={`${s.profileMessage} ${
            message.type === 'success'
              ? s.profileMessageSuccess
              : s.profileMessageError
          }`}
          role="alert"
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
            ×
          </button>
        </div>
      )}

      <section className={s.profileMainGrid}>
        <form
          className={s.profileFormCard}
          onSubmit={submitProfile}
        >
          <header className={s.profileSectionHeader}>
            <div>
              <span className={s.profileEyebrow}>
                Personal information
              </span>

              <h2>Update your profile</h2>

              <p>
                Change your name, contact number or profile picture.
              </p>
            </div>

            <span>
              <FaUser />
            </span>
          </header>

          <div className={s.profileImageEditor}>
            <div className={s.profilePreview}>
              <img
                src={previewUrl}
                alt="Profile preview"
                onError={(event) => {
                  event.currentTarget.src = '/fallback.svg';
                }}
              />

              <span>
                <FaCamera />
              </span>
            </div>

            <div className={s.profileUpload}>
              <h3>Profile photo</h3>

              <p>
                Use a clear square image. JPG, PNG and WebP files up to
                5 MB are supported.
              </p>

              <label className={s.profileUploadButton}>
                <FaImage />
                Choose a new image

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                />
              </label>

              {file && (
                <span className={s.profileFileName}>
                  Selected: {file.name}
                </span>
              )}
            </div>
          </div>

          <div className={s.profileFormGrid}>
            <label
              className={`${s.profileField} ${s.profileFieldFull}`}
            >
              <span>Full name</span>

              <div className={s.profileInputIcon}>
                <FaUser />

                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your full name"
                  maxLength={100}
                  required
                />
              </div>

              <small>
                This name is shown throughout your account.
              </small>
            </label>

            <label className={s.profileField}>
              <span>Email address</span>

              <div
                className={`${s.profileInputIcon} ${s.profileReadOnly}`}
              >
                <FaEnvelope />

                <input value={user?.email || ''} disabled />
              </div>

              <small>Your login email cannot be edited here.</small>
            </label>

            <label className={s.profileField}>
              <span>Phone number</span>

              <div className={s.profileInputIcon}>
                <FaPhone />

                <input
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="Enter your contact number"
                  maxLength={20}
                />
              </div>

              <small>Optional contact information.</small>
            </label>
          </div>

          <footer className={s.profileActions}>
            <div>
              {isDirty ? (
                <span>You have unsaved profile changes.</span>
              ) : (
                <span>Your profile information is up to date.</span>
              )}
            </div>

            <button
              type="submit"
              className={s.profileSaveButton}
              disabled={saving || !isDirty}
            >
              <FaCircleCheck />

              {saving ? 'Saving changes...' : 'Save profile'}
            </button>
          </footer>
        </form>

        <aside className={s.profileSide}>
          <article className={s.profileAccountCard}>
            <header>
              <span>
                <FaShieldHalved />
              </span>

              <div>
                <span className={s.profileEyebrow}>
                  Account overview
                </span>

                <h2>Your account</h2>
              </div>
            </header>

            <div className={s.profileAccountRows}>
              <div>
                <span>
                  <FaUser />
                  Account name
                </span>

                <strong>{user?.name || 'Traveller'}</strong>
              </div>

              <div>
                <span>
                  <FaEnvelope />
                  Email
                </span>

                <strong>{user?.email}</strong>
              </div>

              <div>
                <span>
                  <FaShieldHalved />
                  Account role
                </span>

                <strong>
                  {user?.role === 'admin'
                    ? 'Administrator'
                    : 'Traveller'}
                </strong>
              </div>

              <div>
                <span>
                  <FaCircleCheck />
                  Account status
                </span>

                <strong className={s.profileActiveText}>
                  {user?.status || 'Active'}
                </strong>
              </div>
            </div>

            <div className={s.profileSecurityNote}>
              <FaLock />

              <p>
                Your authentication credentials are protected and are
                not displayed on this page.
              </p>
            </div>
          </article>

          <article className={s.profilePreferenceCard}>
            <span>
              <FaGear />
            </span>

            <h2>Personalize TripGenie</h2>

            <p>
              Add your travel interests, cuisines, hotel style and
              transport choices so future plans match you better.
            </p>

            <Link to="/preferences">
              Open travel preferences
              <FaArrowRight />
            </Link>
          </article>

          <article className={s.profileCollectionCard}>
            <span>
              <FaHeart />
            </span>

            <div>
              <h3>Your saved collection</h3>

              <p>
                Review the destinations and experiences you have
                shortlisted.
              </p>
            </div>

            <Link to="/favourites" aria-label="Open favourites">
              <FaArrowRight />
            </Link>
          </article>
        </aside>
      </section>
    </div>
  );
}