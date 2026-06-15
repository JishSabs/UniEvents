# 🎓 UniPortal — Campus Hub

A full-featured university web platform built with **Next.js 14**, **Firebase**, **Tailwind CSS**, and **TypeScript**.

## ✨ Features

### Announcements
- **Official announcements** from the university (admin/moderator posts) — visually distinct with a navy banner
- **Student posts** — events, parties, gigs, clubs — with a moderation workflow
- Filter by source (Official / Student) and category
- Pin important announcements to the top
- View count tracking

### Marketplace
- Students can **sell products** (textbooks, electronics, clothes, etc.)
- Students can **offer services** (tutoring, design, coding, etc.)
- **Hire listings** — post jobs or find people to help
- **Gig listings** — freelance work
- WhatsApp/email/phone contact buttons built in
- Category & type filtering

### Roles & Moderation
| Role | Capabilities |
|------|-------------|
| **Student** | Post announcements (requires approval), create marketplace listings, browse everything |
| **Moderator** | All student capabilities + approve/reject/delete announcements, post as Official |
| **Admin** | All moderator capabilities + manage user roles, deactivate users, full platform control |

### Admin Panel
- Review and approve/reject pending student posts
- Assign roles (student → moderator → admin)
- Activate/deactivate user accounts
- Overview dashboard

---

## 🚀 Getting Started

### 1. Clone and install dependencies

```bash
git clone <your-repo>
cd uniportal
npm install
```

### 2. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com) and create a new project
2. Enable **Authentication** → Email/Password sign-in method
3. Enable **Firestore Database** (start in production mode)
4. Enable **Storage** (for image uploads — optional for now)
5. Go to **Project Settings** → **Your Apps** → Add a web app
6. Copy your config credentials

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 4. Set up Firestore Security Rules

Copy the contents of `firestore.rules` and paste into:
Firebase Console → Firestore Database → Rules → Publish

### 5. Set up Firestore Indexes

Either:
- Run `firebase deploy --only firestore:indexes` (if using Firebase CLI), OR
- Manually create the composite indexes listed in `firestore.indexes.json` via the Firebase Console

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Project Structure

```
src/
├── app/                     # Next.js App Router pages
│   ├── page.tsx             # Home/landing page
│   ├── announcements/       # Announcements feed
│   ├── marketplace/         # Marketplace listings
│   ├── admin/               # Admin & moderation panel
│   └── auth/                # Login & register pages
├── components/
│   ├── layout/              # Navbar
│   ├── announcements/       # AnnouncementCard, CreateAnnouncementModal
│   └── marketplace/         # ListingCard, CreateListingModal
├── context/
│   └── AuthContext.tsx      # Firebase Auth + user profile state
├── lib/
│   ├── firebase.ts          # Firebase initialization
│   ├── announcements.ts     # Firestore CRUD for announcements
│   ├── marketplace.ts       # Firestore CRUD for listings
│   ├── users.ts             # User management (admin)
│   └── utils.ts             # Helpers, constants, formatters
└── types/
    └── index.ts             # All TypeScript interfaces
```

---

## 🗄️ Firestore Collections

### `users`
```ts
{
  uid, email, displayName, photoURL?,
  role: 'student' | 'moderator' | 'admin',
  studentId?, department?, yearOfStudy?,
  isActive, createdAt
}
```

### `announcements`
```ts
{
  title, content, source: 'official' | 'student',
  category, status: 'pending' | 'approved' | 'rejected' | 'deleted',
  authorId, authorName, authorRole,
  isPinned, viewCount, imageURL?,
  eventDate?, eventLocation?, tags?,
  approvedBy?, rejectionReason?,
  createdAt, updatedAt
}
```

### `marketplace`
```ts
{
  type: 'product' | 'service' | 'job' | 'gig',
  title, description,
  price?, priceType: 'fixed' | 'negotiable' | 'free' | 'hourly',
  currency, imageURLs[], category, tags?,
  status: 'active' | 'sold' | 'closed' | 'deleted',
  authorId, authorName,
  contactInfo: { whatsapp?, email?, phone? },
  location?, createdAt, updatedAt
}
```

---

## 🔮 Ideas to Add Next

- [ ] **Image uploads** for announcements and marketplace listings (Firebase Storage)
- [ ] **Push notifications** with Firebase Cloud Messaging
- [ ] **Comment/discussion** threads on announcements
- [ ] **Save/bookmark** listings
- [ ] **Student profile pages** with post history
- [ ] **Email verification** to restrict to university email domains
- [ ] **Search** with Algolia or Firestore full-text
- [ ] **Dark mode**
- [ ] **Reporting** system to flag inappropriate posts

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 14 (App Router) | React framework |
| Firebase Auth | Authentication |
| Firestore | Real-time database |
| Firebase Storage | File uploads |
| Tailwind CSS | Styling |
| TypeScript | Type safety |
| react-hot-toast | Notifications |
| lucide-react | Icons |
| date-fns | Date formatting |
