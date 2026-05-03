# Vault.ai - Modern Financial Portfolio Tracker

Vault.ai is a privacy-first, beautiful financial dashboard for tracking mutual funds, goals, and capital allocations.

## Features

- **Real-time NAV Tracking**: Automatically fetches latest prices for Indian Mutual Funds.
- **Portoflio Metrics**: Track absolute gains, XIRR (simulated), and asset allocation.
- **Goal Management**: Define financial goals and track your progress through automated projections.
- **Bento Grid Interface**: A highly responsive, clean UI inspired by modern design trends.
- **Secure**: Authentication and data storage powered by Firebase.

## 🚀 Simple GitHub Pages Deployment

Since the automated GitHub Action had permission issues, we've switched to a simpler method. Follow these steps:

### 1. Configure GitHub Pages
1. Go to your repository on GitHub.com.
2. Click **Settings** (top tab).
3. Click **Pages** (left sidebar).
4. Under **Build and deployment** > **Source**, make sure it is set to **"Deploy from a branch"**.

### 2. Deploy from your computer
Once you have the code on your local machine:
```bash
# 1. Install dependencies
npm install

# 2. Deploy (this builds and pushes to the gh-pages branch)
npm run deploy
```

### 3. Final Settings
1. After running the command, go back to **Settings > Pages**.
2. Select the **`gh-pages`** branch (it will be created automatically) and folder **`/(root)`**.
3. Click **Save**.

### 4. Update Firebase Settings
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Go to **Authentication** > **Settings** > **Authorized Domains**.
3. Add your GitHub Pages URL (e.g., `yourusername.github.io`).

## 🛠 Features & Setup

If you want to host your own instance, copy `.env.example` to `.env` and fill in your Firebase credentials. For GitHub deployments, you can add these variables to **Settings > Secrets and variables > Actions > Variables** using the `VITE_` prefix.

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
