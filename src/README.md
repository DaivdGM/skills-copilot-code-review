# Mergington High School Activities API

A FastAPI + MongoDB application for extracurricular activity coordination at Mergington High School.

## Features

- Browse activities with day/time filtering
- Teacher login for protected operations
- Register and unregister students from activities
- Database-driven announcements with expiration windows
- Announcement management UI for signed-in users

## Getting Started

1. Install dependencies:

   ```
   pip install -r requirements.txt
   ```

2. Run the app from the repository root:

   ```
   uvicorn src.app:app --reload
   ```

3. Open:

   - App: http://localhost:8000/static/index.html
   - API docs: http://localhost:8000/docs

## API Endpoints

### Authentication

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | `/auth/login?username={username}&password={password}` | Authenticate a teacher account |
| GET | `/auth/check-session?username={username}` | Validate a teacher account from stored session data |

### Activities

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/activities` | List activities with optional `day`, `start_time`, and `end_time` filters |
| GET | `/activities/days` | List all scheduled days present in activities |
| POST | `/activities/{activity_name}/signup?email={email}&teacher_username={username}` | Register a student (teacher auth required) |
| POST | `/activities/{activity_name}/unregister?email={email}&teacher_username={username}` | Remove a student from an activity (teacher auth required) |

### Announcements

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/announcements/active` | Public list of currently active announcements |
| GET | `/announcements?teacher_username={username}` | List all announcements (teacher auth required) |
| POST | `/announcements?teacher_username={username}` | Create announcement (teacher auth required) |
| PUT | `/announcements/{announcement_id}?teacher_username={username}` | Update announcement (teacher auth required) |
| DELETE | `/announcements/{announcement_id}?teacher_username={username}` | Delete announcement (teacher auth required) |

## Data Model Overview

### Activities

- `_id` (string activity name)
- `description` (string)
- `schedule` (display text)
- `schedule_details.days` (array of weekday names)
- `schedule_details.start_time` / `schedule_details.end_time` (`HH:MM`)
- `max_participants` (integer)
- `participants` (array of student emails)

### Teachers

- `_id` / `username` (string)
- `display_name` (string)
- `password` (Argon2 hash)
- `role` (string)

### Announcements

- `_id` (Mongo ObjectId)
- `message` (string)
- `start_date` (optional `YYYY-MM-DD`)
- `expiration_date` (required `YYYY-MM-DD`)
- `created_by` (teacher username)
