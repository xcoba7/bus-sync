# Bus Sync - Multi-Tenant SaaS Transportation Management System

A comprehensive, multi-tenant SaaS transportation management system localized to **Abuja, Nigeria**. Built for schools, companies, and communities to manage fleets with real-time GPS tracking, digital attendance, and automated dispatch logic.

## 🚀 Key Features

- **Multi-Tenant SaaS Architecture**: Support for multiple organizations (schools, companies) on a single platform.
- **Abuja Localization**: Pre-configured with Abuja neighborhoods, localized transit logic, and accurate GPS coordinates.
- **Super Admin Dashboard**: Platform-wide oversight of organizations, global user registry, and subscription management.
- **Real-Time GPS Tracking**: Live bus location updates for parents and administrators.
- **Digital Attendance**: Instant boarding and drop-off notifications for guardians.
- **Standardized Dispatch Slots**: Optimized pickup (7 AM) and drop-off (2 PM) scheduling.
- **Role-Based Access**: Specialized interfaces for Super Admins, Organization Admins, Drivers, and Parents.

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or cloud like Neon/Supabase)
- Google Maps API key (Maps JS, Geocoding, Directions APIs enabled)

## 🛠️ Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file with:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/bus_sync"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

### 3. Set Up Database

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

This seeds the system with **5 Organizations** (Abuja schools), **25 Drivers**, **25 Buses**, and **100 Passengers**.

### 4. Start Development

```bash
npm run dev
```

## 👤 Credentials (Seed Data)

### Super Admin (Platform Owner)
- **Email**: `super@bussync.com`
- **Password**: `password`

### Organization Admin (Green Valley Academy)
- **Email**: `admin@bussync.com`
- **Password**: `password`

### Driver (Ibrahim Mohammed)
- **Email**: `driver1@bussync.com`
- **Password**: `password`

### Parent (Ahmadu Bello)
- **Email**: `parent1@bussync.com`
- **Password**: `password`

## 📱 Dashboards

### Super Admin Dashboard
- Create and manage Organizations.
- Global User Registry (provision accounts for any tenant).
- Subscription oversight and platform analytics.

### Admin Dashboard
- Manage organization-specific fleet (Drivers, Buses, Passengers).
- Real-time tracking of all active units.
- Service allocation and route management.

### Driver Dashboard
- Trip controls (Start/End).
- Passenger manifest with boarding/drop-off toggles.
- Real-time location broadcasting.

### Parent Dashboard
- Live map view of child's bus.
- ETA tracking and trip history.
- Critical boarding/drop-off notifications.

## 🗺️ Project Structure

```
bus-sync/
├── app/
│   ├── api/                 # Multi-tenant API routes
│   │   ├── super-admin/     # Platform management
│   │   ├── admin/          # Org-level management
│   │   ├── driver/         # Transit logic
│   │   └── parent/         # Family accessibility
│   ├── super-admin/         # Platform Owner UI
│   ├── admin/               # School/Company Admin UI
│   ├── driver/              # Driver Interface
│   ├── parent/              # Parent Interface
│   └── page.js              # SaaS Landing Page
├── components/              # Shared UI components
├── lib/                     # Prisma & Subscription helpers
├── prisma/                  # Multi-tenant Schema & Seed
└── public/                  # Static assets
```

## 🔧 Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: JavaScript (ES6+)
- **Styling**: Tailwind CSS (Premium Aesthetics)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js
- **Maps**: Google Maps JS API

## 📄 License

Demonstration purposes only for the Bus Sync SaaS Platform.

---

**Built with ❤️ for Abuja's transit ecosystem.**
