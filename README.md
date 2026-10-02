# TRIPGENIE – AI Smart Budget Travel Planner

TripGenie is a complete MCA mini-project built as a portable React + Express + MySQL monorepo. It generates budget-aware, day-wise travel itineraries from database records and optionally uses Groq to rank only approved record IDs. If Groq is unavailable, a deterministic recommendation engine keeps planning functional.

## Implemented features

- Registration, login, logout, JWT access tokens and refresh-token sessions
- Role-based protected user and admin routes
- Profile editing and validated JPG/PNG/WebP uploads
- Persistent travel preferences
- Destination search, filters, pagination and details
- Budget, mid-range, premium and homestay recommendations
- Restaurants embedded into breakfast, lunch and dinner itinerary slots
- Free and paid attractions with non-overlapping itinerary times
- Backend-only cost calculation and over-budget warnings
- Groq database-ID selection, JSON validation, retries and deterministic fallback
- Full itinerary regeneration and one-day regeneration
- Saved-item editing with time-overlap prevention
- Database-backed hotel, restaurant and attraction replacement with automatic budget recalculation
- Transactional trip save, reopen, update and delete APIs
- Favourites, reviews, booking records and grounded travel chat history
- Persistent AI request logs for Groq/fallback source, status and latency
- Admin statistics, users, destinations, hotels, restaurants, attractions, transport, packages, bookings, reviews and trip monitoring
- Admin image URL entry and Multer upload
- Responsive premium dark UI, loading states, empty states, errors, confirmation modals and fallbacks

## Technology stack

Frontend: React, Vite, TypeScript, React Router DOM, Axios, CSS Modules, Framer Motion and React Icons.

Backend: Node.js, Express, mysql2/promise, JWT, bcrypt.js, Express Validator, dotenv, CORS, Multer, Morgan, Helmet, rate limiting and REST APIs.

Database: MySQL through XAMPP.

AI: Groq API, called only from the backend.

## Folder structure

```text
tripgenie/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── pages/
│   │   │   └── admin/
│   │   ├── routes/
│   │   ├── styles/
│   │   └── types/
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── scripts/
│   ├── services/
│   ├── uploads/
│   ├── utils/
│   ├── .env.example
│   └── server.js
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   ├── setup.sql
│   └── reset.sql
├── postman/
│   └── TripGenie.postman_collection.json
├── API_ROUTES.md
└── README.md
```

## Requirements

- Windows 10/11
- Node.js 20 or newer
- XAMPP with MySQL running
- npm
- VS Code recommended
- A Groq API key is optional; fallback planning works without it

## Setup with XAMPP

1. Extract the project to a normal folder, for example `C:\xampp\htdocs\tripgenie` or `C:\Projects\tripgenie`.
2. Open XAMPP Control Panel and start **MySQL**. Apache is not required for the React/Express runtime, but may be used for phpMyAdmin.
3. Open phpMyAdmin and choose **Import**.
4. Import `database/setup.sql`. It creates the `tripgenie` database, all tables and the full seed data.
5. Copy `backend/.env.example` to `backend/.env`.
6. Copy `frontend/.env.example` to `frontend/.env`.
7. Set a long random `JWT_SECRET` in `backend/.env`.
8. Add `GROQ_API_KEY` and a compatible `GROQ_MODEL` when AI ranking is desired.

Never put `GROQ_API_KEY` in the frontend `.env` file.

## Database alternatives

From the backend folder, after creating `.env`:

```powershell
npm install
npm run setup-db
```

To delete and rebuild the seeded database:

```powershell
npm run reset-db
```

Both scripts use `database/setup.sql` or `database/reset.sql` and support XAMPP's default blank root password.

## Run commands

Open two terminals.

Backend:

```powershell
cd backend
npm install
npm run dev
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The backend health endpoint is `http://localhost:5000/api/health`.

Production frontend check:

```powershell
cd frontend
npm run build
npm run preview
```

Production backend:

```powershell
cd backend
npm start
```

## Demo credentials

Admin:

- Email: `admin@tripgenie.local`
- Password: `Admin@123`

Normal user:

- Email: `user@tripgenie.local`
- Password: `User@123`

Change these credentials before a public deployment.

## Groq configuration

Backend `.env`:

```env
GROQ_API_KEY=your_key_here
GROQ_MODEL=openai/gpt-oss-20b
GROQ_TIMEOUT_MS=30000
GROQ_MAX_RETRIES=2
```

The recommendation flow is:

1. Express Validator validates the trip request.
2. MySQL returns active destinations, available hotels, matching restaurants, attractions and transport.
3. The backend filters and sends only these candidates to Groq.
4. Groq returns JSON containing database IDs, an explanation and tips.
5. The backend removes unknown IDs and fills missing selections using deterministic ranking.
6. The backend calculates every category and total.
7. Saving uses a transaction across trips, days, itinerary items and trip budgets.

Groq errors, invalid JSON, missing keys, timeouts and rate limits automatically use the fallback engine.

## Seed data

The included database contains:

- 25 destinations across India
- 100 hotels, four per destination
- 125 restaurants, five per destination
- 150 attractions, six per destination
- 75 transportation choices
- 25 travel packages
- Budget, mid-range, premium and homestay options
- Vegetarian, vegan, halal, gluten-free, Jain-friendly and mixed-menu food records
- Free and paid attractions
- Admin and user accounts

Prices are seeded estimates for project demonstration, not live quotations.

## Budget model

The backend calculates:

```text
Accommodation = nightly price × nights × rooms
Food = selected average meal prices × travellers × days
Attractions = selected entry fees × travellers
Transport = selected per-person transport prices × travellers
Total = categories + miscellaneous + contingency
```

It also returns planned budget, remaining amount, percentage used, per-person cost, per-day cost, over-budget amount and minimum required budget.

## Postman testing

1. Import `postman/TripGenie.postman_collection.json`.
2. Ensure `baseUrl` is `http://localhost:5000/api`.
3. Run **Auth → Login user**. Its test script saves the access token.
4. Run destination, AI and trip requests.
5. Run **Auth → Login admin** before admin requests.

See `API_ROUTES.md` for the complete endpoint list.

## Image uploads

Admin and profile uploads accept JPG, PNG and WebP. The default maximum is 5 MB and can be changed using `MAX_UPLOAD_MB`. Uploaded files are stored in `backend/uploads` and served from `/uploads/...`. URL fields remain supported. The frontend replaces failed images with `public/fallback.svg`.

## Security notes

- Passwords use bcrypt with 12 rounds.
- Access tokens are short-lived JWTs.
- Refresh tokens are random values; only SHA-256 hashes are stored.
- MySQL queries use placeholders for user values.
- Admin tables are selected through a strict server whitelist.
- Login and AI routes are rate limited.
- Helmet adds security headers.
- CORS accepts only configured frontend origins.
- Password hashes and secrets are never returned.
- Production errors do not return stack traces.

## Troubleshooting

### `Unknown database 'tripgenie'`

Import `database/setup.sql`, or run `npm run setup-db` from `backend`. Confirm that `.env` contains `DB_NAME=tripgenie` with no leading or trailing space.

### `ECONNREFUSED 127.0.0.1:3306`

Start MySQL in XAMPP. Confirm that XAMPP is using port 3306, or update `DB_PORT`.

### Access denied for `root`

Use the password configured in XAMPP. The default XAMPP root account is commonly blank locally, so `DB_PASSWORD=` is valid only when that is actually your configuration.

### CORS browser error

Keep frontend on port 5173 or update `FRONTEND_URL`. Multiple origins can be comma-separated. Restart the backend after editing `.env`.

### 401 or expired JWT

Log in again. Confirm `JWT_SECRET` exists and has not changed since the token was issued.

### 403 admin error

Use the seeded admin account or change the user's role from the admin Users page.

### Groq 401

Check the API key and ensure it has no quotes or spaces.

### Groq model error

Set `GROQ_MODEL` to a model currently available to your Groq account. The project intentionally does not hardcode the key.

### Groq timeout or rate limit

The UI remains usable because fallback selection is automatic. Increase `GROQ_TIMEOUT_MS` only when required.

### Port already in use

Change backend `PORT`, then update frontend `VITE_API_URL`. For Vite, run `npm run dev -- --port 5174` and update `FRONTEND_URL`.

### Uploaded image is rejected

Use JPG, PNG or WebP under the configured size limit. Ensure `backend/uploads` is writable.

## Acceptance checklist

- [x] React/TypeScript application and production scripts
- [x] Express REST API and centralized error handling
- [x] MySQL normalized schema and large seed
- [x] Registration, login, JWT and admin authorization
- [x] Destination, hotel, restaurant, attraction and transport data
- [x] Database-grounded Groq selection
- [x] Deterministic no-Groq fallback
- [x] Server-side financial calculations
- [x] Day-wise restaurants and attractions
- [x] Save, reopen, update and delete trip APIs
- [x] Complete and one-day itinerary regeneration
- [x] Favourites, reviews, bookings, profile and preferences
- [x] Admin CRUD, uploads and monitoring
- [x] Responsive states and image fallbacks
- [x] Environment examples, Postman collection and troubleshooting

## Known limitations

- Seed prices, travel durations, opening times and availability are demonstration estimates and are not connected to live booking providers.
- The project records bookings but does not process payments or make external reservations.
- Currency can be stored, but there is no live foreign-exchange conversion service.
- Geographic routing uses seeded transfer durations rather than a live maps API.
- AI chat is grounded to destination summaries; itinerary generation contains the richer hotel, restaurant, attraction and transport grounding.
