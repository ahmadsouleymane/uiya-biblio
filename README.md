# Biblio — Système de gestion de bibliothèque

Application de gestion de bibliothèque : catalogue, utilisateurs, emprunts, présences par QR code,
réservations, amendes, avis, événements et notifications.

Développée pour l'UIYA.

## Auteur

**Créé et développé intégralement par Ahmad Souleymane** ([@ahmadsouleymane](https://github.com/ahmadsouleymane)) — mars 2026.

L'intégralité de l'architecture, du backend, du frontend et de la base de données a été conçue
et écrite par l'auteur. Voir [CREDITS.md](./CREDITS.md).

## Stack

| Partie | Technologie |
|---|---|
| Backend | Node.js · Express 5 · MongoDB (Mongoose) |
| Frontend | React 19 · Vite · Tailwind CSS v4 · React Router v7 |
| Auth | JWT (cookie httpOnly, 30 jours) |
| Médias | Cloudinary (PDF) · couvertures en base64 |
| Emails | Resend |
| IA | Groq (génération de descriptions) |

## Installation

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # puis renseigner les valeurs
npm run dev               # http://localhost:7080
```

Variables requises dans `backend/.env` :
- `MONGO_URI` — chaîne de connexion MongoDB
- `JWT_SECRET` — secret de signature des JWT

Optionnelles (fonctionnalités désactivées si absentes) :
- `CLOUDINARY_*` — upload des PDF
- `RESEND_API_KEY` — emails de rappel et de retard
- `GROQ_API_KEY` — génération automatique des descriptions

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:7080
npm run dev               # http://localhost:5173
```

## Structure

```
backend/    API Express — routes, contrôleurs, modèles Mongoose, services
frontend/   SPA React — pages, composants, appels API
```

## Licence

MIT — voir [LICENSE](./LICENSE). Le crédit d'auteur doit être conservé.
