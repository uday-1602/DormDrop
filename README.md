# 🎓 DormDrop

**DormDrop** is a college-exclusive marketplace where Indian university students can buy and sell items — from textbooks and electronics to clothes and furniture — all verified within their campus community.

> Built with React + Vite, backed by Firebase Auth, Supabase, and Cloudinary, and powered by AI content moderation.

---

## ✨ Features

### 🛒 Marketplace
- Browse active listings from students across 100+ Indian colleges (IITs, NITs, IIITs, and top private universities)
- Filter by **college**, **category**, **max price**, or keyword search
- Paginated product grid (20 items per page)
- Listings hidden from the seller's own feed

### 📦 Create a Listing
- Upload **3–5 product photos** with live preview (min 3 required)
- Automatic **HEIC/HEIF → JPEG conversion** for iPhone photos
- Images are compressed by 50%+ before upload to save bandwidth
- AI automatically assigns the correct **category** (Books, Electronics, Clothes, etc.)

### 🤖 Multi-Layer AI Content Moderation
Every listing is screened through a **cascading moderation pipeline** before it goes live:

| Layer | Tool | What it checks |
|-------|------|---------------|
| 1 | Local keyword filter | Prohibited text (drugs, weapons, alcohol, explicit content) |
| 2 | Google Gemini *(primary)* | Deep AI analysis of image + title + description |
| 3 | OpenAI omni-moderation *(fallback)* | Fallback if Gemini quota is exhausted |

### 💬 Real-Time Messaging
- In-app messaging between buyers and sellers per listing
- Messages inbox showing all active conversations
- Real-time updates via Supabase

### 🔐 Authentication
- **Email/Password** sign-up and login
- **Google Sign-In** (one-click OAuth)
- Persistent sessions via Firebase Auth
- Protected routes — listing creation, messaging, and account require login

### 👤 Account Management
- View and edit your profile
- Update your college affiliation
- View your own active listings

### 📂 Categories
Clothes · Mobiles & Laptops · Electronics · Furniture · Books · Sports · Vehicles · Accessories · Stationery · Musical Instruments

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router v7, Vite 7 |
| Auth | Firebase Authentication (Email + Google OAuth) |
| Database | Supabase (PostgreSQL) |
| Image Storage | Cloudinary |
| AI Moderation | Google Gemini, OpenAI omni-moderation, NSFWJS + TensorFlow.js |
| AI Categorization | Google Gemini |
| Search | Fuse.js (fuzzy search) |
| Image Processing | heic2any, browser Canvas API |
| Styling | Vanilla CSS with CSS custom properties |
| Linting | ESLint 9 |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm or yarn
- Firebase project (Auth enabled)
- Supabase project
- Cloudinary account
- Google Gemini API key

### Installation

```bash
git clone https://github.com/your-username/dormdrop.git
cd dormdrop
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Firebase
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Supabase
VITE_SUPABASE_URL=https://your_project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# AI / Moderation
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_OPENAI_API_KEY=your_openai_key          # optional fallback
```

### Run locally

```bash
npm run dev
```

App will be available at `http://localhost:5173`

### Build for production

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── Header.jsx          # Nav bar with auth state
│   ├── AuthModal.jsx        # Login / Sign-up modal
│   ├── ProductCard.jsx      # Listing preview card
│   ├── CollegeSelector.jsx  # Searchable college dropdown
│   ├── CategorySelector.jsx # Category filter
│   ├── Button.jsx
│   ├── Input.jsx
│   └── Toast.jsx
│
├── pages/              # Route-level page components
│   ├── HomePage.jsx         # Marketplace feed + filters
│   ├── ProductDetailPage.jsx
│   ├── CreateListingPage.jsx
│   ├── MessagingPage.jsx    # Chat thread
│   ├── MessagesInboxPage.jsx
│   └── AccountPage.jsx
│
├── context/
│   └── AuthContext.jsx      # Firebase + Supabase auth state
│
├── lib/                # Service integrations
│   ├── firebase.js
│   ├── supabaseClient.js
│   ├── cloudinary.js
│   ├── gemini.js           # Gemini AI moderation + categorization
│   ├── moderation.js       # Multi-layer moderation pipeline
│   └── imageUtils.js       # Image compression helpers
│
├── constants.js        # College list + categories
├── App.jsx             # Routes + protected route wrapper
└── main.jsx
```

---

## 🛡️ Supabase Schema (key tables)

| Table | Key Columns |
|-------|------------|
| `users` | `id` (Firebase UID), `email`, `name`, `college`, `avatar_url` |
| `listings` | `id`, `title`, `description`, `price`, `category`, `college`, `seller_id`, `seller_name`, `images[]`, `status` |
| `messages` | `id`, `listing_id`, `sender_id`, `receiver_id`, `content`, `created_at` |

---

## 🌐 Deployment

DormDrop is deployed on **Vercel**.

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add all environment variables in the Vercel dashboard
4. Add your Vercel domain to Firebase's **Authorized Domains** list
5. Enable Google Sign-In for the live domain in Firebase Console

---

## 📜 License

MIT — feel free to fork and adapt for your own university community!
