# Vault.ai - Modern Financial Portfolio Tracker

Vault.ai is a privacy-first, beautiful financial dashboard for tracking mutual funds, goals, and capital allocations.

## Features

- **Real-time NAV Tracking**: Automatically fetches latest prices for Indian Mutual Funds.
- **Portoflio Metrics**: Track absolute gains, XIRR (simulated), and asset allocation.
- **Goal Management**: Define financial goals and track your progress through automated projections.
- **Bento Grid Interface**: A highly responsive, clean UI inspired by modern design trends.
- **Secure**: Authentication and data storage powered by Firebase.

## 🚀 Automated GitHub Pages Deployment

This app is configured to deploy automatically to GitHub Pages whenever you push code to the `main` branch.

### 1. Fix "Insufficient Permissions" (Crucial)
GitHub Actions often lack the permission to deploy by default. To fix this:
1. Go to your repo **Settings** > **Actions** > **General**.
2. Scroll to the bottom to **Workflow permissions**.
3. Select **"Read and write permissions"**.
4. Check **"Allow GitHub Actions to create and approve pull requests"** (optional but recommended).
5. Click **Save**.

### 2. Configure Pages Source
1. Go to **Settings** > **Pages**.
2. Under **Build and deployment** > **Source**, change "Deploy from a branch" to **"GitHub Actions"**.

### 3. Add Your Environment Variables
To ensure the app works after deployment, you must add your Firebase credentials to GitHub:
1. Go to **Settings** > **Secrets and variables** > **Actions** > **Variables** (Tab).
2. Click **New repository variable** for each of these:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_DATABASE_ID`

### 4. Update Firebase Authorized Domains
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Go to **Authentication** > **Settings** > **Authorized Domains**.
3. Add your GitHub Pages domain (e.g., `username.github.io`).

## 🛠 Manual Local Setup

If you want to host your own instance, copy `.env.example` to `.env` and fill in your Firebase credentials. 

### How to get your Firebase Credentials:
1. Open [Firebase Console](https://console.firebase.google.com/).
2. Click **Project Settings** (Gear icon ⚙️).
3. Scroll down to **Your apps** > **Web apps**.
4. Select **Config** to see the values for `apiKey`, `authDomain`, etc.

### For GitHub Deployments:
You should add these as **Variables** (not Secrets, since they are public anyway in the build) in your GitHub Repository:
1. Go to **Settings > Secrets and variables > Actions > Variables**.
2. Add each variable starting with `VITE_` (e.g., `VITE_FIREBASE_API_KEY`).

```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project
...
```

## Security Rules

Ensure you deploy the included `firestore.rules` to your Firebase project to keep your data secure.

---

Built with React 19, Vite, Tailwind CSS 4, and Framer Motion.
