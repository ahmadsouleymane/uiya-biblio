# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Biblio** is a library management system for a school/university. It handles book cataloging, user registration (students/staff/admins), book loans, and physical presence tracking via QR codes.

## Development Commands

### Backend (Express + MongoDB)
```bash
cd backend
npm start        # runs nodemon server.js — auto-reloads on changes
```
Runs on `http://localhost:7080`.

### Frontend (React + Vite)
```bash
cd frontend
npm run dev      # start Vite dev server at http://localhost:5173
npm run build    # production build
npm run lint     # run ESLint
npm run preview  # preview production build
```

### Environment Variables

**backend/.env** requires:
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — secret for signing JWTs

**frontend/.env** requires:
- `VITE_API_URL` — backend URL (e.g., `http://localhost:7080`)

## Architecture

### Backend (`/backend`)
Standard Express MVC:
- `server.js` — entry point; mounts `/user` and `/book` route prefixes, configures CORS for `localhost:5173`, cookie-parser, JSON body parsing
- `config/db.js` — Mongoose connection
- `routes/` — route definitions delegating to controllers
- `controllers/` — business logic
- `models/` — Mongoose schemas

**Data models:**
- `User` — fullName, email, phone, department, year, role (`student`|`admin`|`employee`), hashed password, QR code (base64 data URL of their MongoDB `_id`)
- `Book` — isbn (unique), title, author (array), publisher, year, pages, category, cover (URL), copies, availableCopies
- `Loan` — references User + Book, tracks borrowDate, returnDate, status (`borrowed`|`returned`|`late`)
- `Presence` — references User, tracks checkIn/checkOut timestamps

**Auth:** JWT stored in an `httpOnly` cookie (7-day expiry). The `POST /user/addUser` endpoint registers and auto-logs-in. `GET /user/me` validates the cookie and returns the current user.

### Frontend (`/frontend`)
React 19 SPA using React Router v7, Tailwind CSS v4, and `react-hot-toast` for notifications.

- `src/main.jsx` — router setup with all routes
- `src/pages/` — full page components (home, bookPage, login, signup, profile, admin, addBook, category, activity)
- `src/components/` — shared UI (navbar, adminNavbar, book card, sectionTitle, scrollToTop)
- `src/api/` — fetch wrappers (`book.js`, `user.js`) using `VITE_API_URL` from env
- `src/contexts/AuthContext.jsx` — `UserContext` providing `{user, setUser}` state globally
- `src/screen.js` — (utility, check before editing)

The Vite config allows ngrok hostnames (`*.ngrok-free.app`) so the dev server can be exposed externally.

### Key Patterns
- Frontend API calls use native `fetch` (not axios, despite axios being listed as a dependency)
- Auth state is managed via `UserContext` — call `GET /user/me` on app load to hydrate it
- Book cover images are stored as URLs (not uploaded files)
- QR codes are generated server-side using the `qrcode` library and stored as base64 data URLs on the User document
