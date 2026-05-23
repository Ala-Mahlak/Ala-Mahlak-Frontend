<p align="center">
  <img src="src/assets/Ala%20Mahla%201st%20Logo%20Animation.gif" alt="Ala Mahlak logo" width="160" />
</p>

# Ala Mahlak Frontend

Ala Mahlak Frontend is a company dashboard for driver and fleet monitoring. It provides authenticated company access, driver management, trip monitoring, distraction alert review, driver assignment workflows, support conversations, and profile management.

## Features

- Company authentication with login, registration, forgot-password, OTP reset, and protected app routes.
- Dashboard overview with fleet KPIs, recent distraction alerts, and active driver summaries.
- Company administration tools for listing, creating, promoting, downgrading, and removing admins.
- Driver management with API-backed company driver lists, search, status filters, and detail pages.
- Trip monitoring with API-backed company trips and mock active-trip/alert summaries.
- Alert review for phone usage, drowsiness, looking away, and eating/drinking events using local mock data.
- Driver assignment page with company-code copy support and API-backed pending join-request decisions.
- Support center with mock live chat conversations and tickets stored through React Query cache updates.
- Profile page for local profile edits and API-backed company logo upload/removal.

> [!NOTE]
> Some screens use mock data from `src/data/mockData.ts`, while company drivers, trips, admins, reports, join requests, auth, and logo operations call the backend API.

## Tech Stack

- React 19 with TypeScript and JSX transform
- Vite 6 with `@vitejs/plugin-react`
- Tailwind CSS 4 through `@tailwindcss/vite`
- React Router 7 for routing and route guards
- TanStack React Query 5 for server/cache state
- Framer Motion for page and panel transitions
- Lucide React icons
- ESLint 9 with TypeScript, React Hooks, and React Refresh rules

## Prerequisites

- Node.js compatible with Vite 6 and TypeScript 5.8
- npm or Yarn
- Access to the Ala Mahlak backend API when using authenticated/API-backed screens

## Setup

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The Vite dev server proxies `/api/*` requests to `https://ala-mahlak.runasp.net`.

## Configuration

No environment variables are currently read by the frontend. API requests use `BASE_URL = '/api'` in `src/services/authService.ts`.

> [!IMPORTANT]
> Production deployments must serve or proxy `/api` to the backend API, or the API base path in `src/services/authService.ts` must be changed before building.

## Scripts

```bash
npm run dev      # Start Vite development server
npm run build    # Type-check with tsc -b and create a production Vite build
npm run lint     # Run ESLint across the project
npm run preview  # Preview the production build locally
```

There is no test script configured in `package.json`.

## Usage

Public routes:

- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`

Authenticated routes:

- `/dashboard` - fleet overview and recent alerts
- `/companies` - admin management and driver reports
- `/drivers` - company driver list
- `/drivers/:id` - driver details
- `/trips` - company trips and distraction alert monitoring
- `/alerts` - searchable/filterable alert review
- `/assign` - company-code sharing and pending join requests
- `/support` - support chat and tickets
- `/profile` - account/profile details and company logo updates

Authentication state is stored in `localStorage` under Ala Mahlak-specific keys, including the access token and company/session profile data.

## Project Structure

```text
.
|-- public/                  # Static public assets
|-- src/
|   |-- assets/              # Ala Mahlak logo animations and local SVG assets
|   |-- components/          # Shared app shell components
|   |-- context/             # Auth context and session state
|   |-- data/                # Mock dashboard, alert, trip, support, and driver data
|   |-- hooks/               # React Query data hooks
|   |-- pages/               # Route-level pages
|   |-- services/            # Backend API client and session helpers
|   |-- App.tsx              # Routes and auth guards
|   |-- main.tsx             # React, router, query, and auth providers
|   `-- vite-env.d.ts        # Vite type references
|-- eslint.config.js         # ESLint configuration
|-- index.css                # Tailwind import and global styles
|-- index.html               # Vite HTML entry
|-- package.json             # Scripts and dependencies
|-- tsconfig*.json           # TypeScript project configs
`-- vite.config.ts           # Vite plugins and dev API proxy
```
