# 🧭 TravelOps — Custom Travel Itinerary & Operations Mapping Dashboard

A production-ready, full-stack **Custom Travel Itinerary & Operations Mapping Dashboard** built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **MongoDB Atlas (Mongoose)**, and **Google Maps**.

![Dashboard Preview](https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop&q=80)

---

## ✨ Features & Architecture

### 1. 🗄️ Database & API (MongoDB Atlas + Mongoose)
- **Strict Location Model** with categories:
  - `sightseeing` (Emerald/Sky Blue)
  - `activity` (Amber/Orange)
  - `experience` (Violet/Purple)
- **Optimized Connection Handler**: Connection pooling with global caching tailored for Next.js App Router and Vercel Serverless runtimes.
- **RESTful Route Handlers**:
  - `GET /api/locations`: Query & filter by category, city, or full-text search.
  - `POST /api/locations`: Validate and insert custom locations.
  - `POST /api/seed`: Seed sample destinations on demand.
  - `GET /api/itineraries` & `POST /api/itineraries`: Persist full multi-day trip plans.

### 2. 🗺️ Middle Column (Interactive Google Map Area)
- **Google Maps Integration**: Using `@vis.gl/react-google-maps`.
- **Custom Color-Coded Markers**: Category-styled pins with interactive hover states and stop sequence numbers (`1, 2, 3...`).
- **Interactive Route Polyline**: Dynamically draws navigation polylines with directional arrows connecting each stop of the active itinerary day.
- **Rich InfoWindow**: Displays destination photo, duration, estimated budget, tags, rating, and "+ Add to Day" action.
- **Built-in Interactive Vector Engine**: Seamless zero-config fallback if an API key is not yet set up.

### 3. 📑 Left Column (Location Explorer & Library)
- **Category Filter Tabs**: Instant filtering between `[All]`, `[Sightseeing]`, `[Activities]`, and `[Experiences]` with live POI counters.
- **Search & City Filter**: Instant fuzzy search across titles, descriptions, and tags.
- **Add Location Modal**: Register new POIs with coordinates, descriptions, and quick coordinate presets.

### 4. 🔀 Right Column (Drag-and-Drop Itinerary Builder)
- **Smooth Drag-and-Drop**: Built using `@hello-pangea/dnd` for reordering within days and transferring stops across days.
- **Day-Wise Tabs & Management**: Add unlimited days, edit titles, and organize multi-day expeditions.
- **Automated Route Optimization**: One-click **greedy shortest-distance sequence optimizer** that calculates shortest travel path between stops.
- **Real-Time Day Metrics**: Instant computation of total stops, activity duration, route distance (km), and estimated budget.
- **Export & Sharing**:
  - Download JSON trip schema
  - Print / Export to PDF
  - Copy formatted Markdown summary

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18.17+ or 20+
- npm, pnpm, or yarn

### 2. Environment Variables Setup
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

Fill in your connection credentials in `.env.local`:
```env
# MongoDB Atlas Connection URI
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/travel_dashboard?retryWrites=true&w=majority

# Google Maps JavaScript API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
```

> **Note**: The application includes an in-memory fallback and vector map engine, so it is 100% interactive out of the box even before setting up environment variables!

### 3. Install & Run Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```
├── .env.local.example           # Environment template
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration with custom travel tokens
├── tsconfig.json                # Strict TypeScript configuration
├── package.json                 # Dependencies & scripts
└── src/
    ├── app/
    │   ├── api/
    │   │   ├── locations/
    │   │   │   └── route.ts     # GET (filtered), POST (create location)
    │   │   ├── itineraries/
    │   │   │   └── route.ts     # GET, POST (save trip plans)
    │   │   └── seed/
    │   │       └── route.ts     # Seed sample destinations
    │   ├── globals.css          # Glassmorphism, dark theme, custom scrollbars
    │   ├── layout.tsx           # Google Fonts & Root metadata
    │   └── page.tsx             # 3-Column main dashboard
    ├── components/
    │   ├── explorer/
    │   │   ├── AddLocationModal.tsx
    │   │   ├── LocationCard.tsx
    │   │   └── LocationExplorer.tsx
    │   ├── itinerary/
    │   │   ├── DayColumn.tsx
    │   │   ├── ExportModal.tsx
    │   │   ├── ItineraryBuilder.tsx
    │   │   └── ItineraryItemCard.tsx
    │   ├── layout/
    │   │   └── Header.tsx
    │   └── map/
    │       └── GoogleMapArea.tsx
    ├── lib/
    │   ├── mongodb.ts           # Cached Mongoose connection helper
    │   ├── seed-data.ts         # Rich seed destinations
    │   └── utils.ts             # Distance calculator (Haversine) & category utils
    ├── models/
    │   ├── Itinerary.ts         # Mongoose Itinerary Schema
    │   └── Location.ts          # Mongoose Location Schema (name, category, lat, lng...)
    └── types/
        ├── itinerary.ts         # TypeScript Itinerary interfaces
        └── location.ts          # TypeScript Location & Category types
```

---

## 🚢 Deploying to Vercel

1. Push your repository to GitHub / GitLab / Bitbucket.
2. Import the project in the [Vercel Dashboard](https://vercel.com).
3. Add the Environment Variables:
   - `MONGODB_URI`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
4. Click **Deploy**. Vercel will build and deploy the Next.js App Router application automatically.
