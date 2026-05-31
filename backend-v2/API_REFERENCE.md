# NTU EventConnect API Reference

Base URL: `http://localhost:8000` (dev) / `https://54.175.31.32.nip.io` (prod)

All authenticated endpoints require header: `Authorization: Bearer <token>`

---

## 1. Auth

### POST /api/auth/register
Register a new user.

**Request:**
```json
{
  "name": "string (1-100 chars)",
  "email": "user@example.com",
  "password": "string (6-128 chars)"
}
```

**Response (201):**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Test User",
    "student_id": null,
    "department": null,
    "avatar_url": null,
    "bio": null,
    "is_admin": false,
    "created_at": "2026-05-27T06:00:00"
  },
  "needs_username": false
}
```

### POST /api/auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "string"
}
```

**Response (200):** Same as register response.

### POST /api/auth/google
Google SSO login.

**Request:**
```json
{
  "credential": "google_id_token_string"
}
```

**Response (200):** Same as register response. `needs_username` = true if user has no name set.

### GET /api/auth/me
Get current authenticated user.

**Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "Test User",
  "student_id": null,
  "department": null,
  "avatar_url": null,
  "bio": null,
  "is_admin": false,
  "created_at": "2026-05-27T06:00:00"
}
```

### POST /api/auth/forgot-password

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "如果此 Email 已註冊，重設連結已寄出"
}
```

### POST /api/auth/reset-password

**Request:**
```json
{
  "token": "reset_token_string",
  "new_password": "string (6-128 chars)"
}
```

**Response (200):**
```json
{
  "message": "密碼已重設，請重新登入"
}
```

---

## 2. Users

### PATCH /api/users/me
Update current user profile. (Auth required)

**Request** (all fields optional):
```json
{
  "name": "string (1-100)",
  "bio": "string (max 500)",
  "avatar_url": "/uploads/abc.jpg",
  "department": "string",
  "student_id": "string"
}
```

**Response (200):** `UserOut` (same as GET /api/auth/me)

### GET /api/users/{user_id}
Get public profile of a user.

**Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "Test User",
  "student_id": null,
  "department": null,
  "avatar_url": null,
  "bio": null,
  "is_admin": false,
  "created_at": "2026-05-27T06:00:00",
  "post_count": 5,
  "joined_event_count": 3
}
```

### GET /api/users/me/comments
Get current user's comments. (Auth required)

**Response (200):**
```json
[
  {
    "id": 1,
    "content": "Great event!",
    "created_at": "2026-05-27T10:00:00",
    "post_id": 5,
    "post_title": "My review",
    "post_excerpt": "This event was...",
    "post_is_board_post": true,
    "post_event_id": 10,
    "post_event_title": "NTU Workshop"
  }
]
```

### GET /api/users/me/managed_events
Get events created by current user. (Auth required)

**Query:** `?page=1&size=20`

**Response (200):** `EventListResponse` (see Events section)

---

## 3. Events

### GET /api/events
List events with filters.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| category | string | Filter by official_category (parent activity name) |
| tag | string | Filter by single tag (exact match) |
| tags | string | Comma-separated tags, AND logic (events must have ALL) |
| keyword | string | Search title/content (case-insensitive) |
| date | string | YYYY-MM-DD, sessions on or after this date |
| date_to | string | YYYY-MM-DD, sessions on or before this date |
| location | string | Filter by session location (contains, case-insensitive) |
| sort | string | `id` (default) or `hot` (by bookmark count) |
| page | int | Page number (default 1) |
| size | int | Page size (default 20, max 100) |
| lang | string | `zh` (default) or `en` |

**Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "title": "NTU Workshop",
      "content": "Description...",
      "category": "Lecture",
      "official_category": "Parent Activity Name",
      "image_url": "https://...",
      "organizer": "NTU",
      "contact_phone": "02-1234-5678",
      "contact_email": "contact@ntu.edu.tw",
      "registration_type": "Online",
      "registration_fee": "Free",
      "target_audience": "Students",
      "learning_category": "General",
      "tags": ["免報名費", "學生"],
      "sessions": [
        {
          "id": 1,
          "event_id": 1,
          "session_name": "Session A",
          "session_content": null,
          "instructor": "Prof. Wang",
          "location": "Building 101",
          "date": "2026-06-01",
          "time_range": "14:00-16:00",
          "registration_start": "2026-05-01",
          "registration_end": "2026-05-30",
          "capacity": 50,
          "remaining_slots": 30,
          "meal": "Lunch provided",
          "civil_servant_hours": null,
          "study_hours": null
        }
      ]
    }
  ],
  "total": 336,
  "page": 1,
  "size": 20
}
```

### GET /api/events/{event_id}
Get single event detail.

**Query:** `?lang=zh|en`

**Response (200):** Single `EventDetailOut` (same structure as items above)

### GET /api/events/{event_id}/sessions/{session_id}
Get single session detail.

**Query:** `?lang=zh|en`

**Response (200):** Single `EventSessionOut`

### GET /api/events/categories
List official categories (parent activity names) with session counts.

**Query:** `?lang=zh|en`

**Response (200):**
```json
[
  { "name": "VISION Career Fair", "count": 12 },
  { "name": "NTU Workshop Series", "count": 8 }
]
```

### GET /api/events/tags
List all tags with event counts.

**Response (200):**
```json
[
  { "name": "免報名費", "count": 332 },
  { "name": "免費餐點", "count": 115 },
  { "name": "遠距參加", "count": 54 }
]
```

### GET /api/events/managed
Get events created by current user. (Auth required)

**Query:** `?page=1&size=20`

**Response (200):** `EventListResponse`

### POST /api/events
Create a new event. (Auth required)

**Request:**
```json
{
  "title": "My Event",
  "content": "Description",
  "category": "Workshop",
  "organizer": "NTU CS",
  "image_url": "/uploads/img.jpg",
  "tags": ["學生", "免報名費"],
  "sessions": [
    {
      "session_name": "Morning Session",
      "date": "2026-07-01",
      "time_range": "09:00-12:00",
      "location": "Room 101",
      "capacity": 30
    }
  ]
}
```

**Response (201):** `EventDetailOut`

### PATCH /api/events/{event_id}
Update an event. Only the creator can edit. (Auth required)

**Request** (all fields optional):
```json
{
  "title": "Updated Title",
  "content": "Updated content",
  "category": "Lecture",
  "organizer": "NTU",
  "image_url": "/uploads/new.jpg",
  "tags": ["免報名費"],
  "sessions": [
    { "id": 1, "capacity": 50 },
    { "session_name": "New Session", "date": "2026-07-02", "capacity": 20 }
  ]
}
```

**Response (200):** `EventDetailOut`

---

## 4. Registrations

### POST /api/sessions/{session_id}/register
Register for an event session. Atomic concurrency control. (Auth required)

**Response (201):**
```json
{
  "id": 1,
  "user_id": 1,
  "session_id": 30,
  "status": "success",
  "registered_at": "2026-05-27T06:00:00"
}
```
`status`: `"success"` (got a slot) or `"waitlist"` (no slots, queued)

### DELETE /api/registrations/{reg_id}
Cancel a registration. Releases slot + promotes first waitlisted user. (Auth required)

**Response (200):** `RegistrationOut` with `status: "cancelled"`

### GET /api/users/me/registrations
Get current user's registrations with event/session details. (Auth required)

**Query:** `?page=1&size=20`

**Response (200):**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "session_id": 30,
    "status": "success",
    "registered_at": "2026-05-27T06:00:00",
    "event_id": 15,
    "event_title": "CBE Workshop",
    "event_image": "/uploads/img.jpg",
    "category": "Workshop",
    "official_category": "CBE Series",
    "session_name": "5/27 Session",
    "date": "2026-05-27",
    "time": "14:00-16:00",
    "location": "Room 101"
  }
]
```

### GET /api/events/{event_id}/registrations
Get all registrations for an event. Only the event creator can access. (Auth required)

**Response (200):**
```json
[
  {
    "registration_id": 1,
    "user_id": 1,
    "user_name": "Test User",
    "user_email": "test@test.com",
    "student_id": "B10901001",
    "department": "CSIE",
    "session_id": 30,
    "session_name": "Morning Session",
    "status": "success",
    "registered_at": "2026-05-27T06:00:00"
  }
]
```

---

## 5. Posts (Board / Reviews)

### GET /api/posts
List posts with filters.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| event_id | int | Filter by linked event |
| user_id | int | Filter by author |
| visibility | string | `public`, `private`, or `group` |
| group_id | int | Filter by group |
| is_board_post | bool | true = board posts only |
| category | string | Filter by linked event's category |
| tag | string | Filter by linked event's tag |
| keyword | string | Search title/content |
| tab | string | `all`, `hot`, `new`, `mine`, `bookmarked`, `private` |
| page | int | Page number |
| size | int | Page size (max 100) |

**Response (200):**
```json
[
  {
    "id": 1,
    "user_id": 2,
    "user_name": "Alice",
    "user_avatar": "/uploads/avatar.jpg",
    "event_id": 10,
    "event_title": "NTU Workshop",
    "event_official_category": "Workshop Series",
    "title": "Great experience!",
    "rating": 5,
    "content": "This event was amazing...",
    "images": ["/uploads/img1.jpg", "/uploads/img2.jpg"],
    "visibility": "public",
    "group_id": null,
    "group_name": null,
    "is_board_post": true,
    "is_draft": false,
    "like_count": 3,
    "bookmark_count": 1,
    "comment_count": 2,
    "is_liked": false,
    "is_bookmarked": true,
    "created_at": "2026-05-27T10:00:00",
    "updated_at": "2026-05-27T10:00:00"
  }
]
```

### GET /api/posts/{post_id}
Get post detail with comments.

**Response (200):**
```json
{
  "...same as PostOut above...",
  "comments": [
    {
      "id": 1,
      "post_id": 1,
      "user_id": 3,
      "user_name": "Bob",
      "user_avatar": "/uploads/bob.jpg",
      "content": "Thanks for sharing!",
      "created_at": "2026-05-27T11:00:00"
    }
  ]
}
```

### POST /api/posts
Create a post. (Auth required)

**Request:**
```json
{
  "event_id": 10,
  "title": "My Review",
  "rating": 4,
  "content": "Great event!",
  "images": ["/uploads/img1.jpg"],
  "visibility": "public",
  "group_id": null,
  "is_board_post": true,
  "is_draft": false
}
```

**Response (201):** `PostOut`

Board posts (`is_board_post: true`) require `event_id` and user must have attended an ended session of that event.

### PATCH /api/posts/{post_id}
Update a post. Owner only. (Auth required)

**Request** (all fields optional):
```json
{
  "title": "Updated title",
  "rating": 5,
  "content": "Updated content",
  "images": ["/uploads/new.jpg"],
  "visibility": "public",
  "group_id": null,
  "is_draft": false
}
```

**Response (200):** `PostOut`

### DELETE /api/posts/{post_id}
Delete a post. Owner only. (Auth required)

**Response:** 204 No Content

### POST /api/posts/{post_id}/like
Like a post. Idempotent. (Auth required)

**Response (200):**
```json
{ "liked": true, "like_count": 4 }
```

### DELETE /api/posts/{post_id}/like
Unlike a post. (Auth required)

**Response (200):**
```json
{ "liked": false, "like_count": 3 }
```

### POST /api/posts/{post_id}/bookmark
Bookmark a post. Idempotent. (Auth required)

**Response (200):**
```json
{ "bookmarked": true, "bookmark_count": 2 }
```

### DELETE /api/posts/{post_id}/bookmark
Unbookmark a post. (Auth required)

**Response (200):**
```json
{ "bookmarked": false, "bookmark_count": 1 }
```

### POST /api/posts/{post_id}/comments
Add a comment to a post. (Auth required)

**Request:**
```json
{ "content": "Nice post!" }
```

**Response (201):**
```json
{
  "id": 1,
  "post_id": 1,
  "user_id": 1,
  "user_name": "Test User",
  "user_avatar": "/uploads/avatar.jpg",
  "content": "Nice post!",
  "created_at": "2026-05-27T12:00:00"
}
```

---

## 6. Comments

### PATCH /api/comments/{comment_id}
Edit a comment. Owner only. (Auth required)

**Request:**
```json
{ "content": "Updated comment" }
```

**Response (200):**
```json
{
  "id": 1,
  "content": "Updated comment",
  "created_at": "2026-05-27T12:00:00",
  "user_id": 1,
  "post_id": 1
}
```

### DELETE /api/comments/{comment_id}
Delete a comment. Owner only. (Auth required)

**Response:** 204 No Content

---

## 7. Bookmarks

### POST /api/events/{event_id}/bookmark
Bookmark an event (or specific session). (Auth required)

**Request:**
```json
{ "session_id": 0 }
```
`session_id`: 0 = whole event, non-zero = specific session.

**Response (200):**
```json
{ "bookmarked": true, "bookmark_count": 5, "session_id": 0 }
```

### DELETE /api/events/{event_id}/bookmark
Unbookmark an event. (Auth required)

**Query:** `?session_id=0`

**Response (200):**
```json
{ "bookmarked": false, "bookmark_count": 4, "session_id": 0 }
```

### GET /api/users/me/bookmarks/events
Get current user's bookmarked events. (Auth required)

**Query:** `?page=1&size=20`

**Response (200):**
```json
[
  {
    "bookmarked_session_id": 0,
    "event": { "...EventDetailOut..." }
  }
]
```

### GET /api/users/me/bookmarks/posts
Get current user's bookmarked posts. (Auth required)

**Query:** `?page=1&size=20`

**Response (200):** `PostOut[]`

### GET /api/users/me/drafts
Get current user's draft posts. (Auth required)

**Query:** `?page=1&size=20`

**Response (200):** `PostOut[]`

---

## 8. Groups

### GET /api/groups
List groups the current user owns or belongs to. (Auth required)

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "CS Study Group",
    "owner_id": 1,
    "member_count": 5,
    "post_count": 12,
    "created_at": "2026-05-20T08:00:00"
  }
]
```

### POST /api/groups
Create a group. (Auth required)

**Request:**
```json
{
  "name": "New Group",
  "invite_emails": ["alice@ntu.edu.tw", "bob@ntu.edu.tw"]
}
```

**Response (201):** `GroupOut`

### GET /api/groups/{group_id}
Get group detail with members and pending invitations. (Auth required, member only)

**Response (200):**
```json
{
  "id": 1,
  "name": "CS Study Group",
  "owner_id": 1,
  "member_count": 3,
  "post_count": 5,
  "created_at": "2026-05-20T08:00:00",
  "members": [
    {
      "user_id": 1,
      "user_name": "Owner",
      "user_email": "owner@ntu.edu.tw",
      "user_avatar": "/uploads/avatar.jpg",
      "joined_at": "2026-05-20T08:00:00"
    }
  ],
  "invitations": [
    {
      "id": 3,
      "email": "pending@ntu.edu.tw",
      "status": "pending",
      "created_at": "2026-05-25T10:00:00"
    }
  ]
}
```

### PATCH /api/groups/{group_id}
Update group. Owner only. (Auth required)

**Request:**
```json
{ "name": "Renamed Group" }
```

**Response (200):** `GroupOut`

### DELETE /api/groups/{group_id}
Delete group. Owner only. (Auth required)

**Response:** 204 No Content

### POST /api/groups/{group_id}/invite
Invite a member by email. Owner only. (Auth required)

**Request:**
```json
{ "email": "newmember@ntu.edu.tw" }
```

**Response (201):**
```json
{
  "id": 4,
  "email": "newmember@ntu.edu.tw",
  "status": "pending",
  "created_at": "2026-05-27T08:00:00"
}
```

If user already registered, `status` = `"accepted"` (auto-joined).

### DELETE /api/groups/{group_id}/members/{user_id}
Remove a member. Owner can remove anyone; members can leave themselves. (Auth required)

**Response:** 204 No Content

### DELETE /api/groups/{group_id}/invitations/{invite_id}
Revoke a pending invitation. Owner only. (Auth required)

**Response:** 204 No Content

---

## 9. Uploads

### POST /api/uploads
Upload an image file. (Auth required)

**Request:** `multipart/form-data` with field `file`

Allowed: `.jpg`, `.png`, `.gif`, `.webp` (max 5MB)

**Response (201):**
```json
{
  "url": "/uploads/a1b2c3d4e5f6.jpg",
  "filename": "a1b2c3d4e5f6.jpg",
  "size": 204800
}
```

---

## 10. Health

### GET /api/health

**Response (200):**
```json
{ "status": "ok" }
```
