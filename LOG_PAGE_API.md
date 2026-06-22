# 📅 Log Page - API Documentation

This document describes the new API endpoints required for the Log Page (calendar-based workout history view).

---

## Overview

The Log Page requires two new endpoints:
1. **GET /api/workouts/calendar** - Get days with workouts for a specific month (for calendar indicators)
2. **GET /api/workouts/by-date** - Get all workouts for a specific date (for workout list)

These endpoints complement the existing workout endpoints (`GET /api/workouts`, `POST /api/workouts`, etc.).

---

## New Endpoints

### GET /api/workouts/calendar

Get days with workouts for a specific month. Used to show calendar indicators.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `year` | number | Yes | Year (e.g., 2026) |
| `month` | number | Yes | Month (1-12) |

**Example Request:**
```
GET /api/workouts/calendar?year=2026&month=6
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": [3, 5, 8, 9, 11, 14, 15, 21, 24]
}
```

**Response Description:**
- Returns an array of day numbers (1-31) that have workouts
- Empty array `[]` if no workouts in the month

**Errors:**
- `401` - Unauthorized (invalid or missing token)
- `400` - Missing or invalid year/month parameters

---

### GET /api/workouts/by-date

Get all workouts for a specific date. Returns enriched workout data with exercise details.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | string | Yes | Date in YYYY-MM-DD format (e.g., "2026-06-09") |

**Example Request:**
```
GET /api/workouts/by-date?date=2026-06-09
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ws123",
      "userExerciseId": "ue456",
      "exerciseName": "Lat Pulldown - Wide Grip",
      "equipment": "Cable Machine",
      "primaryMuscle": "Back",
      "secondaryMuscle": "Biceps",
      "workoutDate": "2026-06-09",
      "notes": "Felt strong today!",
      "createdAt": "2026-06-09T18:00:00.000Z",
      "sets": [
        {
          "id": "set1",
          "setNumber": 1,
          "weight": 60,
          "reps": 12,
          "notes": null
        },
        {
          "id": "set2",
          "setNumber": 2,
          "weight": 70,
          "reps": 10,
          "notes": null
        },
        {
          "id": "set3",
          "setNumber": 3,
          "weight": 80,
          "reps": 8,
          "notes": "PR!"
        }
      ]
    },
    {
      "id": "ws124",
      "userExerciseId": "ue457",
      "exerciseName": "Dumbbell Curl",
      "equipment": "Dumbbell",
      "primaryMuscle": "Biceps",
      "secondaryMuscle": "Forearms",
      "workoutDate": "2026-06-09",
      "notes": null,
      "createdAt": "2026-06-09T18:30:00.000Z",
      "sets": [
        {
          "id": "set4",
          "setNumber": 1,
          "weight": 14,
          "reps": 12,
          "notes": null
        },
        {
          "id": "set5",
          "setNumber": 2,
          "weight": 14,
          "reps": 12,
          "notes": null
        },
        {
          "id": "set6",
          "setNumber": 3,
          "weight": 14,
          "reps": 10,
          "notes": null
        }
      ]
    }
  ]
}
```

**Response Description:**
- Returns array of workouts for the specified date
- Each workout includes enriched exercise data (name, equipment, muscles)
- Empty array `[]` if no workouts for the date
- Results ordered by `createdAt` descending (most recent first)

**Errors:**
- `401` - Unauthorized (invalid or missing token)
- `400` - Missing or invalid date parameter

---

## Database Query Examples

### Calendar Endpoint (GET /api/workouts/calendar)

```sql
-- PostgreSQL
SELECT DISTINCT EXTRACT(DAY FROM workout_date) as day
FROM workouts
WHERE user_id = $1
  AND EXTRACT(YEAR FROM workout_date) = $2
  AND EXTRACT(MONTH FROM workout_date) = $3
ORDER BY day;
```

### By-Date Endpoint (GET /api/workouts/by-date)

```sql
-- PostgreSQL
SELECT 
  w.id,
  w.user_exercise_id,
  w.workout_date,
  w.notes,
  w.created_at,
  ue.custom_name,
  e.name as exercise_name,
  eq.name as equipment,
  (
    SELECT json_agg(json_build_object(
      'id', ws.id,
      'setNumber', ws.set_number,
      'weight', ws.weight,
      'reps', ws.reps,
      'notes', ws.notes
    ) ORDER BY ws.set_number)
    FROM workout_sets ws
    WHERE ws.workout_id = w.id
  ) as sets
FROM workouts w
JOIN user_exercises ue ON w.user_exercise_id = ue.id
JOIN exercises e ON ue.exercise_id = e.id
LEFT JOIN equipment eq ON e.equipment_id = eq.id
WHERE w.user_id = $1
  AND w.workout_date = $2
ORDER BY w.created_at DESC;
```

---

## Implementation Notes

### 1. Performance Considerations

- **Calendar endpoint**: Use indexed query on `workout_date` column
- **By-date endpoint**: Consider adding index on `(user_id, workout_date)`
- Both queries should be optimized for quick response times

### 2. Authentication

- Both endpoints require Bearer token authentication
- User can only access their own workouts
- `user_id` should be extracted from JWT, not request parameters

### 3. Response Format

- Follow existing API pattern: `{ success: true, data: ... }`
- Use consistent error format: `{ success: false, error: { code, message } }`

### 4. Caching

- Calendar data can be cached for the current month
- Cache invalidation when new workout is created/updated/deleted

---

## Example Frontend Usage

```javascript
// Fetch calendar data
const fetchWorkoutDays = async (year, month) => {
    const token = localStorage.getItem('token');
    const response = await fetch(
        `${API_URL}/api/workouts/calendar?year=${year}&month=${month}`,
        {
            headers: { 'Authorization': `Bearer ${token}` }
        }
    );
    const data = await response.json();
    return data.data; // Returns [3, 5, 8, 9, ...]
};

// Fetch workouts by date
const fetchWorkoutsByDate = async (date) => {
    const token = localStorage.getItem('token');
    const response = await fetch(
        `${API_URL}/api/workouts/by-date?date=${date}`,
        {
            headers: { 'Authorization': `Bearer ${token}` }
        }
    );
    const data = await response.json();
    return data.data; // Returns array of workout objects
};
```

---

**Document Version:** 1.0.0  
**Last Updated:** June 19, 2026
