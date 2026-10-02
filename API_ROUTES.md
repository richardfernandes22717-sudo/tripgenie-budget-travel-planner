# TripGenie API routes

Base URL: `http://localhost:5000/api`

All responses use `{ success, message, data }`. Protected endpoints require `Authorization: Bearer <accessToken>`.

## System

- `GET /health` — API health

## Authentication and user

- `POST /auth/register` — register
- `POST /auth/login` — login
- `POST /auth/refresh` — issue a new access token
- `POST /auth/logout` — revoke refresh session
- `GET /auth/me` — current user
- `PUT /auth/profile` — update profile, multipart image supported
- `GET /auth/preferences` — preferences
- `PUT /auth/preferences` — create/update preferences

## Destination catalogue

- `GET /destinations?search=&category=&maxBudget=&page=&limit=`
- `GET /destinations/recommendations?budget=`
- `GET /destinations/:id`

## AI and recommendation engine

- `POST /ai/recommend`
- `POST /ai/generate-itinerary`
- `POST /ai/optimize-budget`
- `POST /ai/regenerate-day`
- `POST /ai/chat`

Trip-generation body fields: `origin`, `destinationId`, `totalBudget`, `travellers`, `days`, `startDate`, `endDate`, plus interests, cuisines, dietary requirements, preferences, contingency and miscellaneous reserve.

## Trips

- `GET /trips`
- `POST /trips`
- `GET /trips/:id`
- `PUT /trips/:id`
- `PUT /trips/:id/hotel` — replace the selected hotel and recalculate the budget
- `PUT /trips/:id/items/:itemId` — edit item details/times with overlap validation
- `PUT /trips/:id/items/:itemId/replace` — replace a restaurant or attraction by a valid destination record
- `DELETE /trips/:id`

## Community and records

- `GET /reviews` — public approved reviews
- `POST /reviews` — submit review
- `GET /favourites`
- `POST /favourites`
- `DELETE /favourites/:type/:id`
- `GET /bookings`
- `POST /bookings`

## Admin

All admin endpoints require an admin JWT.

- `GET /admin/stats`
- `GET /admin/users`
- `PUT /admin/users/:id`
- `PUT /admin/reviews/:id/moderate`
- `GET /admin/:resource`
- `POST /admin/:resource`
- `PUT /admin/:resource/:id`
- `DELETE /admin/:resource/:id`

Supported resources: `destinations`, `hotels`, `restaurants`, `attractions`, `transportation`, `travel_packages`, `bookings`, `reviews`, and `trips`. Create/update resource requests may use multipart form data when uploading an image.
