# Urban Wash Kenya

Full-stack laundry & dry-cleaning web application built with **Next.js (App Router)**, **Tailwind CSS**, and **Supabase** (Auth, Postgres + RLS, Realtime, and RPCs).

## Features

- **Public Storefront (`/`, `/services`)**: Responsive hero, transparent KSh pricing cards, 10kg+ automatic bulk discount, and mobile bottom navigation.
- **4-Step Booking Wizard (`/booking`)**: Service & duvet size selection, pickup date/slot, Kenyan contact & address details, simulated M-Pesa STK Push / Cash on Delivery, and instant order confirmation (`UW...`).
- **Live Order Tracking (`/track`)**: Sanitized public tracking by order code (`UW12345`, `UW12344`, `UW12343`) with a 5-stage progress timeline.
- **Customer Dashboard (`/dashboard`)**: Order metrics, order detail dialog with cancellation while pending pickup, real-time notifications, profile defaults, and notification/password settings.
- **Admin Operations Console (`/admin`)**: Pipeline status updates, rider assignment, payment status toggles, service/pricing management, user role management, and customer/rider notifications.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and configure your Supabase project URL and publishable key:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
   ```
3. Apply the SQL migrations in `supabase/migrations/` (`001_initial_schema.sql` and `002_seed_services_and_demo_orders.sql`) to your Supabase project.
4. Start the development server:
   ```bash
   npm run dev
   ```

## Deploying to Render

This repository includes a [`render.yaml`](./render.yaml) Blueprint for a Render Node Web Service.

### Option A: Render Blueprint (Recommended)

1. In the Render Dashboard, choose **New → Blueprint** and select the `Mutisyaaa/Urban-Wash` repository (`main` branch).
2. Enter the two prompted environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Deploy the service.

### Option B: Manual Render Web Service

- **Runtime:** Node (`>=20.9.0`; `NODE_VERSION=22.14.0` recommended)
- **Build Command:** `npm ci --include=dev && npm run build`
- **Start Command:** `npm run start`
- **Health Check Path:** `/`
- **Environment Variables:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### Post-Deploy Supabase Auth Configuration

In **Supabase Dashboard → Authentication → URL Configuration**, set:
- **Site URL:** `https://<your-service>.onrender.com`
- **Redirect URLs:** `https://<your-service>.onrender.com/auth/callback`
