# 꺄르륵 파티 (Kyareureuk Party)

> _"오늘이 지나면 우리 사이, 달라질 거야"_

A private party organization and management platform built exclusively for [연림] (Yeonrim) bar.

## About

Kyareureuk Party is a private party that the Yeonrim bar hosts to their guests, helping people to find their own loves. It is an invitation-only, designed for organizing exclusive events at [연림] bar. The platform ensures that only verified and trusted guests can participate in their event, maintaining the intimate and exclusive atmosphere that makes [연림] special.

## It All Started With...

![Ideation Process](./ideation.jpeg)

The project began with hand-drawn sketches and brainstorming sessions, mapping out user flows, system architecture, and feature requirements - which were thought based from personal experience.

## Features

### Event Management

- Interactive questionnaire system
- Participant status tracking
- Administrative dashboard for organizers

### Payment Integration (TBD)

- Integrated payment processing via TossPayments
- Secure transaction handling
- Payment status tracking

### Social Authentication

- Kakao OAuth integration
- Streamlined user onboarding
- Social login capabilities

### Responsive Design

- Mobile-first approach
- Modern UI with Tailwind CSS
- Radix UI components for accessibility

## Tech Stack

### Frontend

- **Next.js 16** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Radix UI** - Accessible component primitives

### Backend & Database

- **Firebase** - Authentication and Firestore database
- **Next.js API Routes** - Serverless backend functions

### Payment & Authentication

- **TossPayments SDK** - Payment processing
- **Kakao OAuth** - Social authentication

### Development Tools

- **ESLint** - Code linting
- **React Hook Form + Zod** - Form validation
- **Lucide React** - Icon library

### Deployment

- **Vercel** - Hosting and deployment platform

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project setup
- TossPayments account (for payment features)
- Kakao Developers account (for OAuth)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/dkim1112/Party-Organizer.git
   cd kyareureuk-party
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file with the following variables:

   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Kakao OAuth
   KAKAO_CLIENT_ID=your_kakao_client_id
   KAKAO_CLIENT_SECRET=your_kakao_client_secret

   # TossPayments
   NEXT_PUBLIC_TOSS_CLIENT_KEY=your_toss_client_key
   TOSS_SECRET_KEY=your_toss_secret_key

   # Bar Password (for access control)
   BAR_PASSWORD=your_secure_password
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
kyareureuk-party/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/             # Admin dashboard
│   │   ├── api/               # API routes
│   │   │   └── auth/          # Authentication endpoints
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # User dashboard
│   │   ├── payment/           # Payment processing
│   │   ├── questionnaire/     # Event questionnaire
│   │   ├── status/            # Status tracking
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── common/            # Shared components
│   │   ├── layout/            # Layout components
│   │   └── ui/                # UI primitives
│   ├── lib/                   # Utility libraries
│   │   ├── firebase.ts        # Firebase configuration
│   │   ├── firestore.ts       # Database operations
│   │   ├── payment.ts         # Payment utilities
│   │   └── utils.ts           # General utilities
│   └── types/                 # TypeScript type definitions
├── public/                    # Static assets
├── ideation.jpeg              # Initial project sketches
└── package.json               # Dependencies and scripts
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contact

For questions or access requests: [dkim1112](https://github.com/dkim1112)

---

_Made for the [연림] community, by Dongeun Kim._
