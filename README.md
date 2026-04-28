# SevaSetu: AI-Driven Disaster Response & Humanitarian Logistics

> **Our Mission:** To eliminate "Information Chaos" in disaster management. SevaSetu is a high-integrity platform that leverages Geo-Spatial Mathematics, Computer Vision, and Real-Time Orchestration to connect distress signals with verified relief with absolute transparency.

---

## 🚀 Key Project Features (A to Z)

- **AI Verification Pipeline:** Every disaster report and task completion is cross-verified using a dual-engine approach: EXIF Geo-spatial metadata validation and CLIP-based Semantic Vision AI.
- **Automated Volunteer Dispatch:** Proximity-based "Broadcast Dispatch" system that identifies and alerts available volunteers within a 6km radius of a verified need.
- **Biometric-Equivalent Trust:** "Proof of Work" system requiring live-captured, geo-tagged imagery to prevent fraud and ensure aid reaches the destination.
- **Command Center Dashboard:** A real-time, high-frequency polling dashboard for Coordinators, featuring automated Urgency Scoring based on population density and disaster type.
- **Continuous Volunteer Tracking:** Real-time location updates and a "Heartbeat" monitoring system that automatically marks inactive volunteers as offline to maintain dispatch accuracy.
- **Dynamic Heatmapping:** Visualizing disaster clusters and resource needs using interactive Leaflet-based maps.
- **Multi-Role Ecosystem:** Specialized workspaces for **Civilians** (Report), **Volunteers** (Respond), and **Coordinators** (Orchestrate).
- **Offline-First Resilience:** PWA architecture with IndexedDB queuing allows field workers to capture data in zero-connectivity zones; syncing automatically when a signal returns.
- **SevaBot (AI Companion):** A personalized, role-aware chatbot powered by Gemini, trained to assist users with platform navigation and disaster protocol.
- **WhatsApp Reporting Bot:** An automated WhatsApp interface (Twilio-powered) that allows civilians to report distress signals and share GPS locations without installing the app.
- **Trust-Gated Approvals:** A rigorous vetting system for volunteers, requiring manual review and identity proofing before they can accept missions.

---

## 🛠️ System Architecture: How It Works

SevaSetu is built on a "Zero-Trust" architecture for disaster data.

### 1. The Frontend (Command Console)
Built with **React 19** and **Vite**, the frontend is designed for speed and reliability.
- **URL Pathing:**
    - `/` : Public Landing & Project Vision.
    - `/login` / `/register` : Secure authentication gateway.
    - `/field` : The "Field Terminal" for reporting distress with mandatory GPS/AI verification.
    - `/volunteer` : Mission Control for active volunteers to view assignments and submit proof.
    - `/dashboard` : The Coordinator's "War Room" for real-time triage and dispatch.
    - `/user-dashboard` : Personal stats and impact tracking for civilian users.
    - `/volunteer-approvals` : The Vetting Queue where coordinators screen new helpers.
    - `/my-reports` : History of submitted needs and their current resolution status.

### 2. The Backend (Geo-Spatial Logic Core)
A **Node.js/Express** server optimized for high-concurrency spatial queries.
- **PostGIS Integration:** Uses native PostgreSQL geometry types to perform sub-second distance calculations (e.g., `ST_Distance`).
- **LRU Auth Caching:** A custom caching layer intercepts high-frequency dashboard polls, reducing database load by 90% and preventing connection pool exhaustion.
- **Automated Dispatcher:** When a need is verified, a background service triggers a broadcast to all available volunteers within a specific radius.

### 3. The AI Service (Vision & Intelligence)
A dedicated **FastAPI** microservice handling the heavy lifting of machine learning.
- **CLIP Neural Model:** Mathematically compares image vectors against disaster category labels to ensure visual evidence matches the reported need.
- **Metadata Parser:** Extracts binary EXIF data to ensure photos are "Live" and not uploaded from a gallery.

---

## 📡 API Reference (Core Endpoints)

### **Authentication**
- `POST /api/auth/register` : User onboarding.
- `POST /api/auth/login` : Session creation.
- `GET /api/auth/me` : Role & identity verification.

### **Disaster Intelligence (Needs)**
- `POST /api/needs` : Submit a new report (Requires image + GPS).
- `GET /api/needs` : List all reports (Filtered by role/district).
- `PATCH /api/needs/:id/status` : Triage and approve needs (Coordinator only).
- `GET /api/needs/heatmap` : Geo-spatial cluster data.

### **Volunteer Operations**
- `PATCH /api/volunteers/me/location` : Continuous GPS heartbeat.
- `PATCH /api/volunteers/me/availability` : Manual toggle for field readiness.
- `POST /api/volunteer-requests` : Apply to become a verified volunteer.
- `PATCH /api/tasks/:id/complete` : Submit Proof of Work with AI verification.

### **SevaBot AI**
- `POST /api/chat` : Role-aware AI assistant (Gemini 2.5 Flash).

---

## 📂 Project Structure

```text
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI (Maps, Camera, Chat)
│   │   ├── pages/          # Role-specific dashboards (Field, Volunteer, Coordinator)
│   │   ├── services/       # API abstraction layer
│   │   └── utils/          # EXIF manipulation & Spatial math
├── server/                 # Node.js API (Logic Core)
│   ├── src/
│   │   ├── routes/         # REST Controllers (Needs, Tasks, Volunteers)
│   │   ├── middleware/     # LRU Caching & Role-Based Access Control
│   │   └── services/       # Matching Engine, Scoring, WhatsApp Integration
├── ai-service/             # FastAPI Machine Learning Service
│   └── main.py             # CLIP Model & Image verification logic
└── prisma/                 # Database Schema (PostGIS & Neon)
```

---

## 📈 The Main Agenda: Why SevaSetu?

Traditional disaster response is plagued by **unverified data**. When a flood hits, thousands of reports flood in—many are duplicates, some are fake, and others are outdated. SevaSetu solves this by:
1. **Verifying the Source:** Mandatory Geo-spatial locking.
2. **Verifying the Need:** AI-powered visual evidence check.
3. **Optimizing the Response:** Proximity-based automated dispatch.

By turning "Information Chaos" into "Actionable Intelligence," we save the most valuable resource in any disaster: **Time.**

---
*Developed with a focus on mathematical integrity and humanitarian impact.*

## 🙏 Acknowledgements & Final Word

Thank you for visiting the SevaSetu project. We sincerely appreciate you taking your precious time to explore our vision for a more resilient and transparent disaster response system. 

Our team is dedicated to pushing the boundaries of what technology can do for humanity. Whether you are a developer, a disaster management professional, or a curious visitor, your interest means a lot to us.

**Thank you for your time and for standing with us in our mission.**

---
*Warm Regards,*  
**Team PiroCoders**
