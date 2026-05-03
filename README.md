# Vault.ai - Modern Financial Portfolio Tracker

Vault.ai is a privacy-first, beautiful financial dashboard for tracking mutual funds, goals, and capital allocations.

## Features

- **Real-time NAV Tracking**: Automatically fetches latest prices for Indian Mutual Funds.
- **Portoflio Metrics**: Track absolute gains, XIRR (simulated), and asset allocation.
- **Goal Management**: Define financial goals and track your progress through automated projections.
- **Bento Grid Interface**: A highly responsive, clean UI inspired by modern design trends.
- **Secure**: Authentication and data storage powered by Firebase.

## Deployment to GitHub Pages

1. **Build the project**:
   ```bash
   npm run build
   ```
2. **Deploy the `dist` folder**:
   - You can use the `gh-pages` package or set up a GitHub Action to deploy the `dist/` folder.
   - Note: We have set `base: './'` in `vite.config.ts`, so it will work correctly on `username.github.io/repo-name/`.

## Configuration

If you want to host your own instance, copy `.env.example` to `.env` and fill in your Firebase credentials:

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
