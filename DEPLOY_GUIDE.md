# APSARA BEAUTY MAKEOVER - GitHub Pages Deployment Guide

Yeh website ab **100% static-ready** aur **GitHub Pages compatible** hai! Aap isse GitHub par deploy karke live demo link apne client ko share kar sakte hain.

Design, Colors, Fonts, aur CSS me koi badlav nahi kiya gaya hai. Sabhi features (Appointment booking, Contact inquiry, Admin panel demo) bina kisi external server ke direct browser me smoothly kaam karenge.

---

## Option 1: Automatic Deployment using GitHub Actions (Sabse Aasan Tarika)

Repository me already `.github/workflows/deploy.yml` file add kar di gayi hai.

1. **Apne GitHub repository me jayein**
2. **Settings** tab par click karein
3. Left sidebar me **Pages** par click karein
4. **Build and deployment** section me:
   - **Source**: Select karein `GitHub Actions`
5. Ab jab bhi aap code push karenge (ya Actions tab me jakar "Run workflow" click karenge), website automatically deploy ho jayegi!
6. Kuch seconds baad aapko live link mil jayega:
   `https://<your-username>.github.io/<repository-name>/`

---

## Option 2: Manual Deploy via `gh-pages` Branch (2 Minutes)

Agar aap standard `gh-pages` branch se deploy karna chahte hain:

1. Apne terminal ya computer me run karein:
   ```bash
   npm run build:static
   ```
   *(Yeh command `dist/` folder bana dega jisme aapki fully static website taiyar hogi)*

2. Terminal me install karein `gh-pages` tool (agar pehle se nahi hai):
   ```bash
   npx gh-pages -d dist
   ```

3. Apne GitHub Repository ke **Settings -> Pages** me jayein:
   - **Source**: "Deploy from a branch"
   - **Branch**: `gh-pages` / `/(root)`
   - Click **Save**

Aapki website live ho jayegi!

---

## Demo Admin Panel Credentials for Client:
- **URL**: `https://<your-url>/#admin` ya navigation footer se "Studio Admin Portal"
- **Email**: `admin@apsara.com`
- **Password**: `apsara2026` ya `admin123`

Client appointments review kar sakte hain, status change kar sakte hain, services update kar sakte hain, aur WhatsApp direct click kar sakte hain.
