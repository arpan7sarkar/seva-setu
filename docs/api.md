# 🔌 SevaSetu API Documentation

Base URL: `http://localhost:5000/api`

---

## 🔐 Authentication

### POST `/auth/register`
Register a new user (Coordinator, Field Worker, or Volunteer).
- **Body**: `{ name, email, password, role, org_id, skills? }`
- **Response**: `{ token, user }`

### POST `/auth/login`
Authenticate and get JWT.
- **Body**: `{ email, password }`
- **Response**: `{ token, user }`

---

## 🚨 Needs

### POST `/needs`
Create a new community need (Auto-calculates urgency score).
- **Auth**: Required
- **Body**: `{ title, description, need_type, lat, lng, ward, district, people_affected, is_disaster_zone }`
- **Response**: Need object with `urgency_score`.

### GET `/needs`
List all needs with optional filters.
- **Query Params**: `status`, `district`, `need_type`, `min_urgency`
- **Response**: Array of needs with geo-coordinates.

### GET `/needs/heatmap`
Optimized endpoint for map heatmap rendering.
- **Response**: `[{ lat, lng, urgency_score }, ...]`

### GET `/needs/:id/matches`
Smart Dispatch: Returns top 3 volunteers for a need.
- **Auth**: Coordinator Only
- **Response**: `[{ id, name, match_score, distance_km, skills }, ...]`

---

## 📋 Tasks

### POST `/tasks`
Assign a volunteer to a need.
- **Auth**: Coordinator Only
- **Body**: `{ need_id, assigned_volunteer_id, notes }`

### PATCH `/tasks/:id/checkin`
Volunteer arrival at site.
- **Auth**: Volunteer Only
- **Updates**: Status to `in_progress`.

### PATCH `/tasks/:id/complete`
Mark task as finished and update impact.
- **Auth**: Volunteer Only
- **Updates**: Status to `completed`, increments volunteer stats.

---

## 🦸 Volunteers

### PATCH `/volunteers/me/availability`
Toggle volunteer availability.
- **Body**: `{ is_available: boolean }`

### PATCH `/volunteers/me/location`
Update current GPS location for matching.
- **Body**: `{ lat, lng }`
