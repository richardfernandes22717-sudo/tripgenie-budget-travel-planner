import {
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import axios from 'axios';
import {
  FaArrowLeft,
  FaArrowRight,
  FaCircleCheck,
  FaCircleExclamation,
  FaCompass,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaHotel,
  FaLock,
  FaRoute,
  FaShieldHalved,
  FaUser,
  FaWallet,
  FaWandMagicSparkles,
} from 'react-icons/fa6';
import { Link, useNavigate } from 'react-router-dom';

import Brand from '../components/Brand';
import { useAuth } from '../context/AuthContext';
import styles from '../components/ui.module.css';
type Mode = 'login' | 'register';

type ValidationIssue = {
  msg?: string;
  path?: string;
};

type ApiErrorBody = {
  message?: string;
  errors?: ValidationIssue[];
};

type StoredUser = {
  role?: string;
};

function getRequestError(error: unknown): string {
  if (!axios.isAxiosError<ApiErrorBody>(error)) {
    return 'Request failed. Please try again.';
  }

  const responseBody = error.response?.data;

  const validationMessages = responseBody?.errors
    ?.map((issue) => issue.msg?.trim())
    .filter((message): message is string => Boolean(message));

  if (validationMessages?.length) {
    return validationMessages.join(' ');
  }

  if (!error.response) {
    return 'Cannot reach the backend. Confirm that it is running on port 5000.';
  }

  return responseBody?.message || 'Request failed. Please try again.';
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getStoredUser(): StoredUser | null {
  try {
    return JSON.parse(
      localStorage.getItem('tripgenie_user') || 'null',
    );
  } catch {
    return null;
  }
}

function AuthShell({ mode }: { mode: Mode }) {
  const auth = useAuth();
  const navigate = useNavigate();

  const isLogin = mode === 'login';

  const rememberedEmail =
    localStorage.getItem('tripgenie_remembered_email') || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState(
    isLogin ? rememberedEmail : '',
  );
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');
  const [rememberEmail, setRememberEmail] = useState(
    Boolean(rememberedEmail),
  );
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const passwordRules = useMemo(
    () => ({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      matches:
        Boolean(password) &&
        Boolean(confirmPassword) &&
        password === confirmPassword,
    }),
    [password, confirmPassword],
  );

  const passwordStrength = useMemo(() => {
    const completedRules = [
      passwordRules.length,
      passwordRules.uppercase,
      passwordRules.number,
    ].filter(Boolean).length;

    if (completedRules === 0) {
      return {
        label: 'Enter a secure password',
        value: 0,
      };
    }

    if (completedRules === 1) {
      return {
        label: 'Weak password',
        value: 33,
      };
    }

    if (completedRules === 2) {
      return {
        label: 'Almost there',
        value: 66,
      };
    }

    return {
      label: 'Strong password',
      value: 100,
    };
  }, [passwordRules]);

  const validateForm = () => {
    const cleanEmail = email.trim();

    if (!isLogin) {
      if (name.trim().length < 2) {
        return 'Your name must contain at least 2 characters.';
      }

      if (name.trim().length > 100) {
        return 'Your name cannot exceed 100 characters.';
      }
    }

    if (!isValidEmail(cleanEmail)) {
      return 'Enter a valid email address.';
    }

    if (!password) {
      return 'Enter your password.';
    }

    if (!isLogin) {
      if (
        !passwordRules.length ||
        !passwordRules.uppercase ||
        !passwordRules.number
      ) {
        return 'Use at least 8 characters with one uppercase letter and one number.';
      }

      if (!passwordRules.matches) {
        return 'The passwords do not match.';
      }
    }

    return '';
  };

  const fillDemoAccount = (
    accountType: 'user' | 'admin',
  ) => {
    if (accountType === 'admin') {
      setEmail('admin@tripgenie.local');
      setPassword('Admin@123');
    } else {
      setEmail('user@tripgenie.local');
      setPassword('User@123');
    }

    setError('');
  };

  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    setError('');

    try {
      if (isLogin) {
        await auth.login(email.trim(), password);

        if (rememberEmail) {
          localStorage.setItem(
            'tripgenie_remembered_email',
            email.trim(),
          );
        } else {
          localStorage.removeItem(
            'tripgenie_remembered_email',
          );
        }

        const signedInUser = getStoredUser();

        navigate(
          signedInUser?.role === 'admin'
            ? '/admin'
            : '/dashboard',
          {
            replace: true,
          },
        );
      } else {
        await auth.register({
          name: name.trim(),
          email: email.trim(),
          password,
        });

        navigate('/dashboard', {
          replace: true,
        });
      }
    } catch (requestError: unknown) {
      setError(getRequestError(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={styles.authPage}>
      <section className={styles.authVisualPanel}>
        <img
          className={styles.authVisualImage}
          src={
            isLogin
              ? 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1500&q=88'
              : 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1500&q=88'
          }
          alt={
            isLogin
              ? 'Indian travel destination'
              : 'Historic Indian architecture'
          }
          onError={(event) => {
            event.currentTarget.src = '/fallback.svg';
          }}
        />

        <div className={styles.authVisualOverlay} />

        <div className={styles.authVisualTop}>
          <Link to="/" className={styles.authBackHome}>
            <FaArrowLeft />
            Return home
          </Link>

          <span className={styles.authSecureBadge}>
            <FaShieldHalved />
            Secure account access
          </span>
        </div>

        <div className={styles.authStory}>
          <span className={styles.authStoryEyebrow}>
            <FaWandMagicSparkles />
            {isLogin
              ? 'Continue your journey'
              : 'Start travelling smarter'}
          </span>

          <h1>
            {isLogin ? (
              <>
                Your next adventure
                <span>is still waiting.</span>
              </>
            ) : (
              <>
                Better trips begin with
                <span>a better plan.</span>
              </>
            )}
          </h1>

          <p>
            {isLogin
              ? 'Sign in to review saved journeys, continue editing itineraries and plan your next budget-friendly experience.'
              : 'Create your TripGenie account to discover destinations and build complete travel plans around your budget.'}
          </p>

          <div className={styles.authVisualFeatures}>
            <article>
              <span>
                <FaWallet />
              </span>

              <div>
                <strong>Budget-aware planning</strong>
                <small>
                  Understand your estimated cost before travelling.
                </small>
              </div>
            </article>

            <article>
              <span>
                <FaRoute />
              </span>

              <div>
                <strong>Day-wise itineraries</strong>
                <small>
                  Hotels, meals and activities in one plan.
                </small>
              </div>
            </article>

            <article>
              <span>
                <FaCompass />
              </span>

              <div>
                <strong>Personalized discovery</strong>
                <small>
                  Find experiences matching your interests.
                </small>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.authFormPanel}>
        <div className={styles.authFormContainer}>
          <Link to="/" className={styles.authBrandLink}>
            <Brand />
          </Link>

          <div className={styles.authFormHeading}>
            <span className={styles.authFormEyebrow}>
              {isLogin
                ? 'Welcome back'
                : 'Create your account'}
            </span>

            <h2>
              {isLogin
                ? 'Sign in to TripGenie'
                : 'Begin your next journey'}
            </h2>

            <p>
              {isLogin
                ? 'Enter your account details to continue.'
                : 'Join TripGenie and start building personalized travel plans.'}
            </p>
          </div>

          {error && (
            <div
              className={styles.authError}
              role="alert"
              aria-live="polite"
            >
              <span>
                <FaCircleExclamation />
              </span>

              <div>
                <strong>
                  {isLogin
                    ? 'Sign-in unsuccessful'
                    : 'Registration unsuccessful'}
                </strong>

                <p>{error}</p>
              </div>
            </div>
          )}

          {isLogin && (
            <div className={styles.authDemoAccounts}>
              <div>
                <span>Demo access</span>
                <small>
                  Select an account to fill the credentials.
                </small>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => fillDemoAccount('user')}
                >
                  <FaUser />
                  Demo user
                </button>

                <button
                  type="button"
                  onClick={() => fillDemoAccount('admin')}
                >
                  <FaShieldHalved />
                  Demo admin
                </button>
              </div>
            </div>
          )}

          <form
            className={styles.authModernForm}
            onSubmit={submit}
            noValidate
          >
            {!isLogin && (
              <label className={styles.authField}>
                <span>Full name</span>

                <div className={styles.authInputWrap}>
                  <FaUser />

                  <input
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Enter your full name"
                    minLength={2}
                    maxLength={100}
                    autoComplete="name"
                    required
                  />
                </div>
              </label>
            )}

            <label className={styles.authField}>
              <span>Email address</span>

              <div className={styles.authInputWrap}>
                <FaEnvelope />

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </label>

            <label className={styles.authField}>
              <span>Password</span>

              <div className={styles.authInputWrap}>
                <FaLock />

                <input
                  type={
                    showPassword ? 'text' : 'password'
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder={
                    isLogin
                      ? 'Enter your password'
                      : 'Create a secure password'
                  }
                  minLength={8}
                  maxLength={128}
                  autoComplete={
                    isLogin
                      ? 'current-password'
                      : 'new-password'
                  }
                  required
                />

                <button
                  type="button"
                  className={styles.authPasswordToggle}
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                >
                  {showPassword ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}
                </button>
              </div>
            </label>

            {!isLogin && (
              <>
                <label className={styles.authField}>
                  <span>Confirm password</span>

                  <div className={styles.authInputWrap}>
                    <FaLock />

                    <input
                      type={
                        showPassword ? 'text' : 'password'
                      }
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(
                          event.target.value,
                        )
                      }
                      placeholder="Enter the password again"
                      minLength={8}
                      maxLength={128}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </label>

                <div className={styles.authPasswordStrength}>
                  <div>
                    <span
                      style={{
                        width: `${passwordStrength.value}%`,
                      }}
                    />
                  </div>

                  <small>{passwordStrength.label}</small>
                </div>

                <div className={styles.authPasswordRules}>
                  <span
                    className={
                      passwordRules.length
                        ? styles.authRuleComplete
                        : ''
                    }
                  >
                    <FaCircleCheck />
                    At least 8 characters
                  </span>

                  <span
                    className={
                      passwordRules.uppercase
                        ? styles.authRuleComplete
                        : ''
                    }
                  >
                    <FaCircleCheck />
                    One uppercase letter
                  </span>

                  <span
                    className={
                      passwordRules.number
                        ? styles.authRuleComplete
                        : ''
                    }
                  >
                    <FaCircleCheck />
                    One number
                  </span>

                  <span
                    className={
                      passwordRules.matches
                        ? styles.authRuleComplete
                        : ''
                    }
                  >
                    <FaCircleCheck />
                    Passwords match
                  </span>
                </div>
              </>
            )}

            {isLogin && (
              <label className={styles.authRemember}>
                <input
                  type="checkbox"
                  checked={rememberEmail}
                  onChange={(event) =>
                    setRememberEmail(event.target.checked)
                  }
                />

                <span>Remember my email on this device</span>
              </label>
            )}

            <button
              type="submit"
              className={styles.authSubmitButton}
              disabled={busy}
            >
              {busy ? (
                <>
                  <span
                    className={styles.authButtonSpinner}
                  />
                  {isLogin
                    ? 'Signing you in...'
                    : 'Creating your account...'}
                </>
              ) : (
                <>
                  {isLogin
                    ? 'Sign in securely'
                    : 'Create my account'}
                  <FaArrowRight />
                </>
              )}
            </button>
          </form>

          <div className={styles.authSwitch}>
            <span>
              {isLogin
                ? 'New to TripGenie?'
                : 'Already have an account?'}
            </span>

            <Link to={isLogin ? '/register' : '/login'}>
              {isLogin
                ? 'Create an account'
                : 'Sign in instead'}
              <FaArrowRight />
            </Link>
          </div>

          <div className={styles.authTrustNote}>
            <FaShieldHalved />

            <p>
              Your credentials are securely processed through the
              TripGenie authentication service.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export const Login = () => <AuthShell mode="login" />;

export const Register = () => (
  <AuthShell mode="register" />
);