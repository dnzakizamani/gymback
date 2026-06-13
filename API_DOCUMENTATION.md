# 📡 Tilar's Gym Tracker - API Documentation

**Base URL:** `/api`
**Authentication:** Bearer Token (JWT)
**Content-Type:** `application/json`

---

## 📋 Table of Contents

1. [Authentication](#-authentication)
2. [Master Data](#-master-data)
3. [User Exercises](#-user-exercises)
4. [Workout Sessions](#-workout-sessions)
5. [Progress & Stats](#-progress--stats)
6. [Common Patterns](#-common-patterns)

---

## 🔐 Authentication

### POST /api/auth/register
Register a new user account.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123",
  "fullName": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx123abc",
      "email": "john@example.com",
      "fullName": "John Doe",
      "isAdmin": false,
      "createdAt": "2026-06-10T08:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors:**
- `400` - Email already exists
- `400` - Password too short (min 8 chars)
- `400` - Invalid email format

---

### POST /api/auth/login
Authenticate user and get token.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx123abc",
      "email": "john@example.com",
      "fullName": "John Doe",
      "isAdmin": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors:**
- `401` - Invalid credentials

---

### POST /api/auth/logout
Logout user (invalidate token server-side if needed).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET /api/auth/me
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "clx123abc",
    "email": "john@example.com",
    "fullName": "John Doe",
    "isAdmin": false,
    "createdAt": "2026-06-10T08:00:00.000Z"
  }
}
```

---

### PUT /api/auth/profile
Update user profile.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "fullName": "John Smith"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "clx123abc",
    "email": "john@example.com",
    "fullName": "John Smith",
    "isAdmin": false
  }
}
```

---

### PUT /api/auth/password
Change password.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

**Errors:**
- `400` - Current password incorrect

---

## 🏋️ Master Data

### GET /api/exercises
Get all master exercises (public, no auth required).

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `muscleGroup` | string | - | Filter by muscle group (e.g., "Back", "Chest") |
| `equipment` | string | - | Filter by equipment name |
| `search` | string | - | Search by name |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ex123",
      "name": "Lat Pulldown - Wide Grip",
      "description": "Targets lats and upper back",
      "imageUrl": "https://example.com/lat-pulldown.jpg",
      "equipment": {
        "id": "eq1",
        "name": "Cable Machine"
      },
      "muscles": [
        {
          "id": "mg1",
          "name": "Back",
          "category": "pull",
          "isPrimary": true
        },
        {
          "id": "mg2",
          "name": "Biceps",
          "category": "pull",
          "isPrimary": false
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### GET /api/exercises/:id
Get single exercise details.

**Request:**
```
http://localhost:3000/api/exercises/cable-fly
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "ex123",
    "name": "Lat Pulldown - Wide Grip",
    "description": "Targets lats and upper back",
    "imageUrl": "https://example.com/lat-pulldown.jpg",
    "equipment": {
      "id": "eq1",
      "name": "Cable Machine"
    },
    "muscles": [
      {
        "id": "mg1",
        "name": "Back",
        "category": "pull",
        "isPrimary": true
      },
      {
        "id": "mg2",
        "name": "Biceps",
        "category": "pull",
        "isPrimary": false
      }
    ]
  }
}
```

---

### GET /api/muscle-groups
Get all muscle groups.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "mg1",
      "name": "Back",
      "category": "pull"
    },
    {
      "id": "mg2",
      "name": "Chest",
      "category": "push"
    },
    {
      "id": "mg3",
      "name": "Legs",
      "category": "legs"
    }
  ]
}
```

---

### GET /api/equipment
Get all equipment types.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "eq1",
      "name": "Cable Machine"
    },
    {
      "id": "eq2",
      "name": "Barbell"
    },
    {
      "id": "eq3",
      "name": "Dumbbell"
    }
  ]
}
```

---

## 📝 User Exercises

### GET /api/user-exercises
Get user's saved exercises (with optional stats).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `muscleGroup` | string | - | Filter by muscle group |
| `includeStats` | boolean | false | Include PR, last session, etc. |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ue123",
      "customName": null,
      "notes": "Keep elbows tucked",
      "createdAt": "2026-06-01T08:00:00.000Z",
      "exercise": {
        "id": "ex123",
        "name": "Lat Pulldown - Wide Grip",
        "imageUrl": "https://example.com/lat-pulldown.jpg",
        "equipment": {
          "id": "eq1",
          "name": "Cable Machine"
        },
        "muscles": [
          {
            "name": "Back",
            "isPrimary": true
          },
          {
            "name": "Biceps",
            "isPrimary": false
          }
        ]
      },
      "stats": {
        "personalRecord": 80.5,
        "lastSession": "2026-06-08",
        "totalSessions": 12
      }
    }
  ]
}
```

---

### POST /api/user-exercises
Add exercise to user's list.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "exerciseId": "ex123",
  "customName": "My Lat Pulldown",
  "notes": "Keep elbows tucked"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "ue456",
    "userId": "clx123abc",
    "exerciseId": "ex123",
    "customName": "My Lat Pulldown",
    "notes": "Keep elbows tucked",
    "createdAt": "2026-06-10T08:00:00.000Z"
  }
}
```

**Errors:**
- `400` - Exercise already in user's list
- `404` - Exercise not found

---

### PUT /api/user-exercises/:id
Update user's exercise (custom name, notes).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "customName": "Updated Name",
  "notes": "New notes"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "ue456",
    "customName": "Updated Name",
    "notes": "New notes",
    "updatedAt": "2026-06-10T09:00:00.000Z"
  }
}
```

---

### DELETE /api/user-exercises/:id
Remove exercise from user's list.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Exercise removed from your list"
}
```

---

## 💪 Workout Sessions

### GET /api/workouts
Get workout history for a user exercise.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `userExerciseId` | string | Yes | User exercise ID |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 10) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ws123",
      "userExerciseId": "ue456",
      "workoutDate": "2026-06-08",
      "notes": "Felt strong today!",
      "createdAt": "2026-06-08T18:00:00.000Z",
      "sets": [
        {
          "id": "set1",
          "setNumber": 1,
          "weight": 60,
          "reps": 12,
          "notes": "Easy warmup"
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
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### POST /api/workouts
Create new workout session.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "userExerciseId": "ue456",
  "workoutDate": "2026-06-10",
  "notes": "Great session",
  "sets": [
    {
      "setNumber": 1,
      "weight": 50,
      "reps": 12,
      "notes": "Warmup"
    },
    {
      "setNumber": 2,
      "weight": 60,
      "reps": 10,
      "notes": null
    },
    {
      "setNumber": 3,
      "weight": 70,
      "reps": 8,
      "notes": null
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "ws789",
    "userExerciseId": "ue456",
    "workoutDate": "2026-06-10",
    "notes": "Great session",
    "createdAt": "2026-06-10T18:30:00.000Z",
    "sets": [
      {
        "id": "set10",
        "setNumber": 1,
        "weight": 50,
        "reps": 12,
        "notes": "Warmup"
      },
      {
        "id": "set11",
        "setNumber": 2,
        "weight": 60,
        "reps": 10,
        "notes": null
      },
      {
        "id": "set12",
        "setNumber": 3,
        "weight": 70,
        "reps": 8,
        "notes": null
      }
    ]
  }
}
```

**Validation:**
- `userExerciseId` required, must belong to user
- `workoutDate` required, format YYYY-MM-DD, cannot be future
- `sets` required, minimum 1 set
- Each set: `weight` > 0, `reps` > 0, `setNumber` starts at 1

---

### GET /api/workouts/:id
Get single workout session.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "ws123",
    "userExerciseId": "ue456",
    "workoutDate": "2026-06-08",
    "notes": "Felt strong today!",
    "sets": [
      {
        "id": "set1",
        "setNumber": 1,
        "weight": 60,
        "reps": 12,
        "notes": null
      }
    ]
  }
}
```

---

### PUT /api/workouts/:id
Update workout session.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "workoutDate": "2026-06-09",
  "notes": "Updated notes",
  "sets": [
    {
      "setNumber": 1,
      "weight": 55,
      "reps": 12,
      "notes": "Changed weight"
    },
    {
      "setNumber": 2,
      "weight": 65,
      "reps": 10,
      "notes": null
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "ws123",
    "workoutDate": "2026-06-09",
    "notes": "Updated notes",
    "sets": [...]
  }
}
```

---

### DELETE /api/workouts/:id
Delete workout session.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Workout deleted successfully"
}
```

---

## 📊 Progress & Stats

### GET /api/progress/exercise/:userExerciseId
Get progress data for chart (best weight per session).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "exerciseId": "ex123",
    "exerciseName": "Lat Pulldown",
    "unit": "kg",
    "chartData": [
      {
        "date": "2026-06-01",
        "bestWeight": 60,
        "totalVolume": 720,
        "totalSets": 3,
        "totalReps": 30
      },
      {
        "date": "2026-06-03",
        "bestWeight": 65,
        "totalVolume": 780,
        "totalSets": 3,
        "totalReps": 30
      },
      {
        "date": "2026-06-08",
        "bestWeight": 80.5,
        "totalVolume": 966,
        "totalSets": 3,
        "totalReps": 30
      }
    ],
    "summary": {
      "totalSessions": 12,
      "firstSession": "2026-05-01",
      "lastSession": "2026-06-08",
      "totalVolume": 10800,
      "improvement": "+34%"
    }
  }
}
```

---

### GET /api/stats/dashboard
Get dashboard statistics for current user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalExercises": 8,
    "totalWorkouts": 45,
    "totalVolume": 45600,
    "thisWeek": {
      "sessions": 4,
      "exercises": 3,
      "volume": 4800
    },
    "personalRecords": [
      {
        "exerciseId": "ex123",
        "exerciseName": "Lat Pulldown",
        "weight": 80.5,
        "date": "2026-06-08"
      },
      {
        "exerciseId": "ex456",
        "exerciseName": "Bench Press",
        "weight": 100,
        "date": "2026-06-05"
      }
    ],
    "recentActivity": [
      {
        "userExerciseId": "ue123",
        "exerciseName": "Lat Pulldown",
        "lastSession": "2026-06-08"
      },
      {
        "userExerciseId": "ue456",
        "exerciseName": "Bench Press",
        "lastSession": "2026-06-05"
      }
    ]
  }
}
```

---

### GET /api/pr/:userExerciseId
Get personal record for specific exercise.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userExerciseId": "ue456",
    "exerciseName": "Lat Pulldown",
    "personalRecord": {
      "weight": 80.5,
      "reps": 8,
      "date": "2026-06-08",
      "sessionId": "ws123"
    },
    "totalPRs": 1
  }
}
```

---

## 🔄 Common Patterns

### Standard Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

### Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Not allowed to access resource |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `CONFLICT` | 409 | Resource already exists |
| `INTERNAL_ERROR` | 500 | Server error |

### Pagination
All list endpoints support pagination:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Query params: `?page=2&limit=20`

### Filtering
Common filter params:
- `muscleGroup` - Filter by muscle (Back, Chest, Legs, Shoulders, Arms, Core)
- `equipment` - Filter by equipment type
- `search` - Text search in name

---

## 🔒 Security

### Authentication Flow
1. Register or Login → Receive JWT token
2. Include token in all protected requests:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Token expires in 7 days (configurable)

### Authorization Rules
- Users can only access their own data
- `userId` is determined from JWT, not request body
- Master data (exercises, equipment, muscles) is public

---

## 🧪 Testing Endpoints (Development)

### POST /api/dev/seed
Seed database with sample data (dev only).

### DELETE /api/dev/reset
Reset database (dev only).

---

**Document Version:** 1.0.0  
**Last Updated:** June 10, 2026
