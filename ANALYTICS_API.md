# Analytics API Documentation

## Overview

This document describes the API endpoints required for the Analytics page to display user workout statistics, personal records, volume charts, workout frequency, and muscle distribution.

## Base URL

```
/api/analytics
```

## Authentication

All endpoints require Bearer token authentication:
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Get Analytics Overview

**GET** `/api/analytics/overview`

Returns overall workout statistics for the user.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalWorkouts": 156,
    "totalVolume": 1245600
  }
}
```

---

### 2. Get Personal Records

**GET** `/api/analytics/personal-records`

Returns the user's personal records, sorted by most recent or highest weight.

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "pr_001",
      "exerciseName": "Bench Press",
      "weight": 90,
      "reps": 5,
      "date": "2026-06-15T10:30:00Z"
    },
    {
      "id": "pr_002",
      "exerciseName": "Squat",
      "weight": 120,
      "reps": 3,
      "date": "2026-06-10T14:00:00Z"
    },
    {
      "id": "pr_003",
      "exerciseName": "Deadlift",
      "weight": 150,
      "reps": 1,
      "date": "2026-06-05T09:00:00Z"
    }
  ]
}
```

---

### 3. Get Volume Chart Data

**GET** `/api/analytics/volume-chart`

Returns volume data for charting, either weekly or monthly.

**Query Parameters:**
- `period`: `weekly` or `monthly` (default: `monthly`)
- `months` (optional): Number of months to look back (default: 6)

**Response (monthly):**
```json
{
  "success": true,
  "data": {
    "period": "monthly",
    "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    "volumes": [45000, 52000, 61000, 78000, 65000, 72000]
  }
}
```

**Response (weekly):**
```json
{
  "success": true,
  "data": {
    "period": "weekly",
    "labels": ["W1", "W2", "W3", "W4", "W5", "W6"],
    "volumes": [12000, 15000, 14000, 18000, 16000, 17000]
  }
}
```

---

### 4. Get Workout Frequency

**GET** `/api/analytics/frequency`

Returns workout frequency statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "thisWeek": 4,
    "thisMonth": 16,
    "thisYear": 138
  }
}
```

---

### 5. Get Weekly Frequency Chart

**GET** `/api/analytics/weekly-frequency`

Returns daily workout counts for the current week.

**Response:**
```json
{
  "success": true,
  "data": {
    "weekStart": "2026-06-16",
    "days": [
      { "day": "Mon", "count": 1 },
      { "day": "Tue", "count": 0 },
      { "day": "Wed", "count": 1 },
      { "day": "Thu", "count": 1 },
      { "day": "Fri", "count": 1 },
      { "day": "Sat", "count": 1 },
      { "day": "Sun", "count": 0 }
    ]
  }
}
```

---

### 6. Get Muscle Distribution

**GET** `/api/analytics/muscle-distribution`

Returns the percentage distribution of workouts by target muscle group.

**Response:**
```json
{
  "success": true,
  "data": [
    { "muscle": "Chest", "percentage": 25 },
    { "muscle": "Back", "percentage": 22 },
    { "muscle": "Legs", "percentage": 20 },
    { "muscle": "Shoulder", "percentage": 15 },
    { "muscle": "Biceps", "percentage": 9 },
    { "muscle": "Triceps", "percentage": 9 }
  ]
}
```

---

## Error Responses

All endpoints may return the following error responses:

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Implementation Notes

1. Volume calculation: Sum of (weight × reps) for all sets in a workout
2. Personal Records: Track max weight lifted per exercise regardless of reps
3. Muscle groups: Based on the `primaryMuscle` of each exercise
4. Weekly frequency: Counts unique workout days (not individual exercises)
