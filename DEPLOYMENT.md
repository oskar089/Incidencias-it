# Deployment Guide - Incidencias IT

This guide walks you through deploying the full-stack application to production using **Render** (backend) and **Vercel** (frontend).

## Architecture Overview

```
┌─────────────────────────┐     HTTPS      ┌─────────────────────────┐
│  Vercel (Frontend)     │  ←──────────→  │  Render (Backend)      │
│  React + Vite          │                │  Node.js + Express     │
│  https://app.vercel.app│                │  https://app.onrender.com│
└─────────────────────────┘                └─────────────────────────┘
                                                         │
                                                         ↓
                                                ┌─────────────────────────┐
                                                │  SQLite Database       │
                                                │  (file-based)          │
                                                └─────────────────────────┘
```

---

## Prerequisites

1. **GitHub Account** - Code must be pushed to a GitHub repository
2. **Render Account** - Sign up at https://render.com (free tier available)
3. **Vercel Account** - Sign up at https://vercel.com (free tier available)
4. **Twilio Account** (optional) - For SMS notifications, sign up at https://twilio.com

---

## Step 1: Push Code to GitHub

Ensure all changes are committed and pushed:

```bash
cd C:/Users/oskar/Documents/MIO/incidencias-it
git add .
git commit -m "feat: Add deployment configuration for Render and Vercel"
git push origin main
```

---

## Step 2: Deploy Backend to Render

### 2.1 Create Render Web Service

1. Log in to **https://dashboard.render.com**
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `incidencias-it`
4. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `incidencias-it-backend` |
| **Environment** | `Node` |
| **Region** | Choose closest to your users (e.g., `Ohio`) |
| **Branch** | `main` |
| **Build Command** | `npm install` |
| **Start Command** | `node src/index.js` |
| **Plan** | `Free` |

### 2.2 Configure Environment Variables

In the Render dashboard, scroll to **"Environment Variables"** and add:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | |
| `JWT_SECRET` | *(click "Generate" button)* | Render can auto-generate a secure secret |
| `DATABASE_PATH` | `./data/helpdesk.db` | SQLite file path |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Update this after Vercel deployment |
| `TWILIO_ACCOUNT_SID` | `ACxxxxxxxx` | From Twilio console (optional) |
| `TWILIO_AUTH_TOKEN` | `your_auth_token` | From Twilio console (optional) |
| `TWILIO_PHONE` | `+1234567890` | Your Twilio phone number (optional) |
| `TECHNICIAN_PHONE` | `+1234567890` | Phone to receive SMS (optional) |

### 2.3 Deploy

1. Click **"Create Web Service"**
2. Render will automatically build and deploy
3. Wait for the build to complete (watch the logs)
4. Once deployed, note your backend URL: `https://incidencias-it-backend.onrender.com`

### 2.4 Verify Backend Deployment

Test the health endpoint:

```bash
curl https://incidencias-it-backend.onrender.com/api/health
# Should return: {"status":"ok"}
```

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Import Project to Vercel

1. Log in to **https://vercel.com/dashboard**
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository: `incidencias-it`
4. Configure the project:

| Setting | Value |
|---------|-------|
| **Project Name** | `incidencias-it-frontend` |
| **Framework Preset** | `Vite` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 3.2 Configure Environment Variables

In the Vercel dashboard, go to **"Settings"** → **"Environment Variables"** and add:

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_API_URL` | `https://incidencias-it-backend.onrender.com` | Production, Preview, Development |

> **Note**: Replace the URL with your actual Render backend URL from Step 2.4

### 3.3 Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy your frontend
3. Once complete, note your frontend URL: `https://incidencias-it-frontend.vercel.app`

---

## Step 4: Update CORS Configuration

After both deployments are complete:

1. Go to **Render Dashboard** → Your Backend Service → **Environment Variables**
2. Update `FRONTEND_URL` to your actual Vercel URL:
   ```
   FRONTEND_URL=https://incidencias-it-frontend.vercel.app
   ```
3. Click **"Save Changes"**
4. Render will automatically redeploy with the updated CORS setting

---

## Step 5: Test Full Stack

### 5.1 Test CORS Configuration

Open your browser and navigate to: `https://incidencias-it-frontend.vercel.app`

1. Open **Developer Tools** (F12) → **Console**
2. Check for CORS errors when the app loads
3. If you see CORS errors, verify the `FRONTEND_URL` in Render is correct

### 5.2 Test API Connectivity

1. Open **Developer Tools** → **Network** tab
2. Try to log in from the frontend
3. Verify the request goes to the correct backend URL
4. Check the response in the Network tab

### 5.3 Test Authentication Flow

1. Register a new user or log in with existing credentials
2. Verify the JWT token is stored in `localStorage` (check **Application** → **Local Storage**)
3. Navigate to protected routes (Dashboard, Incidents)
4. Verify the token is sent in the `Authorization` header

### 5.4 Test Incident Creation/Update

1. Create a new incident
2. Update an incident status to "assigned"
3. (If Twilio is configured) Verify SMS is sent to the technician

---

## Troubleshooting

### Backend Issues

| Problem | Solution |
|---------|----------|
| Build fails on Render | Check `package.json` is in root, not `backend/` subfolder |
| 404 on API routes | Check `startCommand` is `node src/index.js` |
| Database not persisting | Render uses ephemeral filesystem; consider using Render's managed PostgreSQL for production |
| CORS errors | Verify `FRONTEND_URL` env var matches your Vercel domain exactly |

### Frontend Issues

| Problem | Solution |
|---------|----------|
| Build fails on Vercel | Check `vite.config.js` exists in `frontend/` folder |
| API calls fail | Verify `VITE_API_URL` is set correctly in Vercel env vars |
| Blank page | Check browser console for JavaScript errors |
| 404 on refresh | Ensure `vercel.json` has the rewrites configuration |

### CORS Issues

If you see CORS errors in the browser console:

1. Check the backend logs in Render dashboard
2. Verify the `FRONTEND_URL` environment variable is set correctly
3. The CORS config in `backend/src/index.js` should allow your Vercel domain:
   ```javascript
   app.use(cors({
     origin: process.env.FRONTEND_URL || 'http://localhost:5173',
     credentials: true
   }));
   ```

---

## Environment Variables Reference

### Backend (.env on Render)

```bash
PORT=3001                                    # Set by Render automatically
NODE_ENV=production                          # Production mode
JWT_SECRET=your_generated_secret             # Auto-generated by Render
DATABASE_PATH=./data/helpdesk.db            # SQLite file path
FRONTEND_URL=https://your-app.vercel.app    # Your Vercel frontend URL
TWILIO_ACCOUNT_SID=ACxxxxxxxx               # Optional - for SMS
TWILIO_AUTH_TOKEN=your_token                # Optional - for SMS
TWILIO_PHONE=+1234567890                    # Optional - your Twilio number
TECHNICIAN_PHONE=+1234567890                # Optional - SMS recipient
```

### Frontend (.env on Vercel)

```bash
VITE_API_URL=https://your-backend.onrender.com  # Your Render backend URL
```

---

## Important Notes

1. **SQLite on Render**: The free tier uses an ephemeral filesystem. The database will reset on every deploy. For production use, consider:
   - Upgrading to a paid Render plan with persistent disk
   - Migrating to PostgreSQL (Render has a managed PostgreSQL service)

2. **Twilio Trial Limitations**: If using Twilio trial account:
   - You can only send SMS to verified phone numbers
   - Add recipient numbers in the Twilio console before testing

3. **Free Tier Limitations**:
   - Render free tier spins down after 15 minutes of inactivity (cold start ~30s)
   - Vercel free tier has bandwidth limits

4. **Custom Domains**: Both Render and Vercel support custom domains if needed.

---

## Quick Checklist

- [ ] Code pushed to GitHub
- [ ] Backend deployed to Render with env vars set
- [ ] Frontend deployed to Vercel with `VITE_API_URL` set
- [ ] `FRONTEND_URL` updated in Render to Vercel URL
- [ ] CORS working (no errors in browser console)
- [ ] API health check returns `{"status":"ok"}`
- [ ] Login/Register flow works
- [ ] Can create and update incidents
- [ ] (Optional) SMS notifications working

---

## File Overview

| File | Purpose |
|------|---------|
| `render.yaml` | Render deployment configuration (Infrastructure as Code) |
| `frontend/vercel.json` | Vercel deployment configuration |
| `frontend/.env.example` | Example environment variables for local dev |
| `backend/.env.example` | Example environment variables for local dev |
| `DEPLOYMENT.md` | This file - complete deployment guide |
