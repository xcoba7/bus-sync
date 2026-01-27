# Bus Sync - Quick Start Guide

## 🎯 Current Status: Fully Functional SaaS V1

### ✅ What's Done
- **Multi-Tenant Architecture**: Supports multiple organizations within one database.
- **SaaS Interfaces**: Premium dashboards for Super Admin, Admin, Driver, and Parent.
- **Real-Time Logistics**: GPS tracking, digital attendance, and automated dispatch logic.
- **Abuja Localization**: All seed data and transit logic pre-configured for Abuja, Nigeria.
- **Security**: Role-based access control and hashed credentials.

## 🚀 Quick Setup (5 minutes)

### Step 1: Configure Environment

Edit `.env.local` with your local or cloud PostgreSQL and Google Maps API details:

```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/bus_sync"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-api-key"
```

### Step 2: Initialize Platform

```bash
# Generate client and run migrations
npx prisma migrate dev --name init

# Seed platform with Organizations, Drivers, Buses, and Passengers
npx prisma db seed
```

### Step 3: Start the Engine

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 👤 Test the SaaS Ecosystem

The seed script creates a complete ecosystem across 5 organizations (schools).

### 1. Platform Oversight (Super Admin)
- **URL**: `/super-admin/dashboard`
- **Email**: `super@bussync.com` | **PW**: `password`
- **Actions**: View all organizations, manage global user registry, and track platform metrics.

### 2. Organization Management (Admin)
- **URL**: `/admin/dashboard`
- **Email**: `admin@bussync.com` | **PW**: `password`
- **Actions**: Manage a specific school's fleet, drivers, and passengers.

### 3. Fleet Operations (Driver)
- **URL**: `/driver/dashboard`
- **Email**: `driver1@bussync.com` | **PW**: `password`
- **Actions**: "Start Trip" → Allow Location → Mark passengers as "Boarded".

### 4. Client Experience (Parent)
- **URL**: `/parent/dashboard`
- **Email**: `parent1@bussync.com` | **PW**: `password`
- **Actions**: View child's live bus location on map, see ETA, and receive notifications.

## 📊 Scale of Multi-Tenant Seed

- **5 Organizations** (e.g., Green Valley Academy, Skyline International)
- **25 Active Buses** distributed across organizations
- **25 Professional Drivers** with licenses
- **100 Passengers** with localized Abuja addresses
- **25 Routes** with accurate GPS coordinates

## 🐛 Troubleshooting

**Maps Blank?**
- Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is correct.
- Ensure Maps JS, Geocoding, and Directions APIs are enabled in GCP.

**Database Connection?**
- Verify `DATABASE_URL` in `.env.local`.
- Use `npx prisma studio` to inspect the multi-tenant data structures.

## 📁 Project Structure

```
bus-sync/
├── app/
│   ├── api/                 # Multi-tenant API routes
│   ├── super-admin/         # Platform Owner UI
│   ├── admin/               # Org-level management UI
│   ├── driver/              # Driver Operations UI
│   ├── parent/              # Family Accessibility UI
│   └── page.js              # Landing page
├── prisma/                  # Schema (User, Org, Bus, Passenger, Trip)
└── .env.local               # Local secrets
```

---

**Built with ❤️ for the next generation of campus and corporate transit.**
