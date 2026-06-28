# Salamtak Full-Stack Medical Follow-up System

Salamtak is a React + Vite frontend connected to a Node.js + Express + MongoDB backend. The original Figma Make UI is preserved while the app now uses real REST APIs, JWT authentication, MongoDB models, seed data, Docker, and deployment config.

## Stack

- Frontend: React 18, Vite, Radix UI
- Backend: Node.js, Express
- Database: MongoDB with Mongoose
- Auth: JWT access tokens, bcrypt password hashing
- Production middleware: Helmet, Compression, CORS, Rate Limiting, Morgan

## Install

```bash
npm install
cp .env.example .env
```

## MongoDB Atlas

1. Create a free cluster at MongoDB Atlas.
2. Create a database user.
3. Allow your IP address in Network Access, or use `0.0.0.0/0` for managed hosting.
4. Copy the connection string into `MONGO_URI`.

Example:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/salamtak?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_URL=http://localhost:3000
VITE_API_URL=http://localhost:5000/api
```

## Seed Data

```bash
npm run seed
```

Test accounts:

- Patient: `01234567890` / `Password123!`
- Doctor: `doctor@salamtak.com` / `Password123!`

## Run Locally

Frontend only:

```bash
npm run frontend:dev
```

Backend only:

```bash
npm run backend:dev
```

Full app:

```bash
npm run dev:full
```

Frontend runs on Vite, usually `http://localhost:3000` or the next available port. Backend runs on `http://localhost:5000`.

## API Overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/doctors`
- `GET /api/doctors/video`
- `GET /api/patients`
- `GET /api/appointments`
- `POST /api/appointments`
- `GET /api/prescriptions`
- `POST /api/prescriptions`
- `GET /api/medication-schedules`
- `POST /api/medication-schedules`
- `PATCH /api/medication-schedules/:id`
- `DELETE /api/medication-schedules/:id`
- `GET /api/reminders`
- `PATCH /api/reminders/:id/read`
- `GET /api/pharmacies`
- `POST /api/orders`
- `GET /api/reviews`
- `POST /api/reviews`
- `POST /api/consultations`
- `POST /api/consultations/:id/messages`
- `PATCH /api/consultations/:id/end`
- `GET /health`

## Build and Checks

```bash
npm run build
npm run lint
```

`npm run lint` is currently mapped to the production build because this export did not include an ESLint setup.

## Docker

```bash
docker compose up --build
```

The compose file starts MongoDB and the app service. For local frontend development with Vite, use `npm run dev:full`.

## Deployment

### Render

Use `render.yaml`, set environment variables in the Render dashboard, and connect the repo.

### Railway

Create a Node service, set the same environment variables, and use:

```bash
npm ci
npm run build
npm start
```

### VPS / Docker

Copy the repo to the server, create `.env`, then:

```bash
docker compose up --build -d
```

For production, set `CLIENT_URL` to the deployed frontend domain and `VITE_API_URL` to the deployed backend `/api` URL.
