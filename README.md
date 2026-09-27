# New Testament Marathon — Frontend

Vue 3 + Vite frontend for the **New Testament Marathon** app, built to match the
supplied UI/UX design pixel-for-pixel and ready to connect to the
Node/Express/MongoDB backend.

## Tech stack

- Vue 3 (Composition API, `<script setup>`)
- Vite
- Vue Router 4 (with auth + admin route guards)
- Pinia (auth / reading / admin stores)
- Tailwind CSS + DaisyUI
- Axios (single instance, auto-attaches the JWT)
- lucide-vue-next (icons)

## Getting started

```bash
npm install
cp .env.example .env   # then set VITE_API_URL to your backend
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Connecting the real backend

Every Pinia store call tries the real API first:

- `src/stores/auth.js` → `POST /auth/login`, `GET /auth/me`
- `src/stores/reading.js` → `GET /readings/today`, `GET /readings/progress`,
  `GET /readings/journey`, `GET /readings/history`, `POST /readings`
- `src/stores/admin.js` → `GET /admin/stats`, `GET /admin/participants`,
  `GET /admin/participants/:id`

If a call fails (for example, because the backend isn't running yet), the
store falls back to the temporary mock data in `src/services/mockData.js` and
logs a `console.warn` so it's obvious mock data is in use. **Once the backend
endpoints above exist, the fallback will simply stop triggering** — no
frontend code changes are required. When you're ready to remove the safety
net entirely, delete the `catch` fallbacks in the stores and the
`mockData.js` file.

`userId` is never sent from the frontend on `POST /readings` — the backend is
expected to read it from the JWT.

## Project structure

```
src/
├── assets/
├── components/
│   ├── common/        # BottomNav, shared UI
│   ├── marathon/
│   ├── reading/
│   └── admin/
├── layouts/
│   ├── UserLayout.vue   # RTL, bottom nav
│   └── AdminLayout.vue  # desktop header + mobile header/nav
├── views/
│   ├── Login.vue                     # English / LTR
│   ├── Home.vue                      # Arabic / RTL dashboard
│   ├── History.vue                   # Arabic / RTL reading log
│   ├── Profile.vue                   # Arabic / RTL
│   ├── AdminDashboard.vue            # desktop table + mobile cards
│   └── AdminParticipantDetails.vue
├── router/index.js     # auth + role guards
├── stores/{auth,reading,admin}.js
├── services/{api.js,mockData.js}
└── main.js
```

## Design notes

- The Login/Welcome screen keeps the original English/LTR copy from the
  design; every other user-facing screen keeps the Arabic/RTL copy from the
  design verbatim (no text was translated or invented beyond what's needed
  to wire up dynamic values like names, dates, and numbers).
- Colors, radii, spacing, and card styles were extracted from the supplied
  screens and centralized in `tailwind.config.js` (`theme.extend.colors.marathon`)
  and `src/style.css` (`.card-surface`, `.btn-primary-dark`).
- Mobile is the primary target (tested down to 360px); the admin dashboard
  is the one screen with a distinct desktop (table) and mobile (card list)
  layout, matching the two supplied admin designs.
- The hero photo on the login screen is a placeholder Unsplash image (an
  open Bible outdoors) standing in for the final asset — swap the `<img
  src>` in `src/views/Login.vue` for the real photo when it's available.

## Known placeholders / follow-ups for the backend team

- Admin top nav has four tabs in the design (`المشاركون`, `جدول القراءات`,
  `نظرة عامة`, `التقارير`); only **المشاركون** (Participants) is wired up,
  since it's the only one specified in the functional requirements. The
  other three render as inactive tabs.
- The "تصدير التقرير (Excel / CSV)" button and "إرسال تذكير" (reminder)
  buttons are present in the UI but not yet wired to an endpoint — add the
  relevant API calls once those endpoints exist.
