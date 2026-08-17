# Lumina Learning — Modern EdTech & Learning Management Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg?logo=react)](https://react.dev/)
[![TanStack Router](https://img.shields.io/badge/TanStack%20Router-1.170-ff4154.svg?logo=react-query)](https://tanstack.com/router)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.2-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646cff.svg?logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**Lumina Learning** (Studycraft Kit) is a full-featured, enterprise-grade frontend web application for modern online education, interactive course streaming, career placements, event hosting, and credential verification. Built with **React 19**, **TanStack Router & Start**, **TypeScript**, and **Tailwind CSS v4**, it provides an intuitive student learning experience paired with a robust administrative dashboard for instructors and platform operators.

---

## 🌟 Key Features

### 🎓 1. Student Experience & Learning Hub
- **Interactive Student Dashboard (`/`)**: Real-time course progress trackers, daily/weekly interactive study calendar, upcoming enrolled events, and course recommendations.
- **Dedicated Course Player (`/learn`)**: Fluid video lesson streaming, rich text descriptions, downloadable PDF lesson resources, curriculum sidebar, and auto-tracked completion.
- **My Learning (`/my-learning`)**: Consolidated dashboard of active and completed courses with quick-resume actions and instant certificate access.
- **Credential Verification (`/certificates`, `/verify-certificate`)**: Digital credential repository with PDF certificate downloads and public UUID verification.

### 📚 2. Course Catalog & Discovery (`/courses`)
- **Filter & Search**: Filter by difficulty level (*Beginner*, *Intermediate*, *Advanced*), price ranges, currencies (USD, EUR, GBP, NGN), and keywords.
- **Rich Course Detail Page (`/courses/$courseId`)**: Syllabus breakdown, instructor biography, lesson count, duration, lesson 1 video preview, and enrollment modal with multi-currency pricing.

### 💼 3. Career & Job Board (`/jobs`, `/applications`)
- **Job Catalog**: Browse job postings with tags for employment type (*Full-Time*, *Part-Time*, *Contract*, *Internship*), salary ranges, and company details.
- **Job Applications**: In-app application workflow with resume file upload, cover letter, portfolio links, and real-time application status tracking.

### 📅 4. Events & Workshops (`/events`)
- **Virtual & In-Person Events**: Explore workshops and conferences with guest speaker profiles, venue info, interactive registration, and digital tickets.

### 🎟️ 5. Promotions & Donations (`/discounts`, `/donations`)
- **Discount & Coupon Explorer**: Discover platform discounts with coupon code copy-to-clipboard, countdown timers, and discount application.
- **Philanthropic Donations**: Support education initiatives through customizable donation tiers with multi-currency support.

### 🛠️ 6. Administration & Instructor Suite (`/admin`, `/manage/*`)
- **Course Studio (`/courses/new`, `/manage/courses/$courseId/edit`)**: Create and update courses with custom cover thumbnails, dynamic pricing, and rich curricula.
- **Lesson Builder (`/manage/courses/$courseId/lessons`)**: Upload and reorder video lectures and PDF resources with drag/order controls.
- **Event Management (`/events/new`, `/manage/events/$eventId/edit`, `/manage/events/$eventId/attendees`)**: Schedule events, modify venue details, and view/export attendee rosters.
- **Job & Applicant Tracking (`/jobs/new`, `/manage/jobs/$jobId/applicants`)**: Post career listings and review applicant resumes and hiring stages.
- **Discount Engine (`/manage/discounts`)**: Configure promo codes, percentage or fixed discounts, usage caps, and course-specific restrictions.
- **User & Role Management (`/users`, `/users/$userId/edit`)**: Manage student and admin accounts with role elevation (*Student*, *Secondary Admin*, *Master Admin*).
- **Audit Logs & Bot Monitoring (`/manage/activity`, `/manage/bot-logs`)**: Real-time searchable and paginated security audit trail and chatbot performance metrics.
- **Organization CMS (`/settings/organization`, `/manage/faqs`)**: Manage landing page FAQs, institution branding, logo, and social channels.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Framework** | [React 19](https://react.dev/), [TanStack Start](https://tanstack.com/start), [TanStack Router](https://tanstack.com/router) |
| **Language** | [TypeScript 5.8](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/), [Radix UI Primitives](https://www.radix-ui.com/), [Lucide React Icons](https://lucide.dev/) |
| **Data Fetching** | [TanStack React Query v5](https://tanstack.com/query) (Automatic caching, deduplication, optimistic invalidation) |
| **HTTP Client** | [Axios](https://axios-http.com/) (JWT Bearer interceptors, automatic 401 refresh queue) |
| **Notifications** | [Sonner](https://sonner.emilkowal.ski/) |
| **Forms & Dates** | [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/), [date-fns](https://date-fns.org/), Custom Date & Time Pickers |
| **Build & Tooling** | [Vite 8](https://vitejs.dev/), [Nitro Engine](https://nitro.unjs.io/), [ESLint](https://eslint.org/), [Prettier](https://prettier.io/) |

---

## 📁 Project Structure

```text
studycraft-kit/
├── src/
│   ├── assets/               # Static images, sample banners, and avatars
│   ├── components/           # Reusable UI component library
│   │   ├── ui/               # Radix UI wrappers (dialog, dropdown, date-picker, time-picker, etc.)
│   │   ├── admin-guard.tsx   # Protected route guard for Admin/Staff access
│   │   ├── app-sidebar.tsx   # Dynamic expanding hover sidebar navigation
│   │   ├── course-selector.tsx
│   │   ├── date-picker.tsx   # Custom calendar date chooser
│   │   ├── time-picker.tsx   # Custom hour/minute/AM-PM picker
│   │   ├── list-option-chooser.tsx # Custom option selector
│   │   └── payment-dialog.tsx# Multi-currency payment modal
│   ├── lib/                  # Core utilities and backend API clients
│   │   ├── api-client.ts     # Axios instance with JWT interceptor & refresh queue
│   │   ├── api-types.ts      # TypeScript interfaces for all backend data models
│   │   ├── auth-api.ts       # Authentication, register, login, password reset
│   │   ├── courses-api.ts    # Course & lesson CRUD with multipart FormData uploads
│   │   ├── events-api.ts     # Events CRUD & registration handlers
│   │   ├── jobs-api.ts       # Job postings & applicant workflows
│   │   ├── discounts-api.ts  # Coupon & discount code management
│   │   ├── enrollments-api.ts# Student course enrollment & progress tracking
│   │   ├── payments-certificates-api.ts # Payment verification & certificates
│   │   ├── users-api.ts      # User profile & administration API
│   │   ├── organization-api.ts# Organization settings & FAQ APIs
│   │   ├── bot-api.ts        # AI assistant & bot telemetry
│   │   └── utils.ts          # Media URL resolvers, currency formatters, class merges
│   ├── routes/               # TanStack file-based routes
│   │   ├── __root.tsx        # Root layout, dynamic sidebar push & theme provider
│   │   ├── index.tsx         # Student Dashboard
│   │   ├── landing.tsx       # Marketing & platform landing page
│   │   ├── learn.tsx         # Video player & lesson classroom
│   │   ├── my-learning.tsx   # Enrolled courses & progress
│   │   ├── certificates.tsx  # Student certificates catalog
│   │   ├── verify-certificate.tsx # Public certificate verification
│   │   ├── courses.*.tsx     # Course catalog, detail, creation, curriculum
│   │   ├── events.*.tsx      # Event listings, detail, creation
│   │   ├── jobs.*.tsx        # Job board, detail, creation
│   │   ├── applications.*.tsx# Job applications tracker
│   │   ├── discounts.*.tsx   # Promo discount listings
│   │   ├── donations.tsx     # Donation portal
│   │   ├── auth.*.tsx        # Login, registration, password recovery
│   │   ├── settings.*.tsx    # User profile & organization settings
│   │   ├── users.*.tsx       # User management directory & edit screens
│   │   ├── admin.tsx         # Admin hub overview
│   │   └── manage.*.tsx      # Management modules (courses, events, jobs, discounts, bot logs, activity)
│   ├── router.tsx            # TanStack Router configuration
│   └── styles/               # Global CSS & Tailwind design tokens
├── public/                   # Public static assets & headers
├── package.json              # Dependencies and build scripts
├── vite.config.ts            # Vite & TanStack Router build configuration
├── tsconfig.json             # TypeScript compiler configuration
└── README.md                 # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` recommended
- **npm** or **pnpm** / **yarn**
- **Backend API Server**: Django REST Framework backend running on `http://localhost:8000` (or configured via `.env`)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/studycraft-kit.git
cd studycraft-kit
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:

```env
# Backend API Base URL (defaults to http://localhost:8000 if not specified)
VITE_API_URL=http://localhost:8000
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (or the port output in your terminal) in your browser.

---

## 📦 Build & Production

To compile the production bundle with Server-Side Rendering (SSR) support:

```bash
# Build client and server bundles
npm run build

# Preview production build locally
npm run preview
```

---

## 🔐 Authentication & Roles

The frontend integrates with JWT Bearer token authentication:
- **Automatic Token Injection**: All requests automatically attach `Authorization: Bearer <token>`.
- **Silent Refresh**: Expired tokens trigger a single background refresh cycle to `/api/token/refresh/` without interrupting user workflows.
- **Role-Based Access Control**:
  - `ST` (**Student**): Access to dashboard, courses, classroom, events, job applications, and certificates.
  - `SA` (**Secondary Admin** / **Instructor**): Access to course creation, lesson management, event scheduling, and job postings.
  - `MA` (**Master Admin**): Full unrestricted access including user management, audit logs, bot telemetry, and organization settings.

---

## 🎨 Design System & Highlights

- **Dynamic Expanding Sidebar**: Smooth width transition (`w-[76px]` to `w-[246px]`) on hover that smoothly pushes page content without obscuring elements.
- **Card Hover Animations**: Subtle elevation (`hover:-translate-y-1.5 hover:shadow-xl`), image zooms (`scale-105`), and brand color transitions.
- **Accessible Custom Controls**: Native-feeling custom date pickers, time pickers, and option selectors tailored to the platform theme.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m "feat: add amazing feature"`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
