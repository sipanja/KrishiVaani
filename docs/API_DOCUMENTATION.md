# KrishiVaani AI — REST API Documentation

Base URL: `/api/v1`  
Authentication: Bearer JWT Token in `Authorization: Bearer <token>` header (where marked 🔒).

---

## 1. Authentication & Profile (`/api/v1/auth`)

### 1.1 Register New Farmer / User
- **Endpoint:** `POST /api/v1/auth/register`
- **Auth:** Public
- **Request Body:**
```json
{
  "username": "ramesh_farmer",
  "phone": "9876543210",
  "email": "ramesh@example.com",
  "password": "SecurePassword123!",
  "role": "farmer",
  "preferred_language": "hi",
  "village": "Kanchrol",
  "district": "Nadia",
  "state": "West Bengal"
}
```
- **Response `201 Created`:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "a1b2c3d4-...",
    "username": "ramesh_farmer",
    "role": "farmer"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

### 1.2 User Login
- **Endpoint:** `POST /api/v1/auth/login`
- **Auth:** Public
- **Request Body:**
```json
{
  "identifier": "ramesh_farmer",
  "password": "SecurePassword123!"
}
```
- **Response `200 OK`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "id": "a1b2c3d4-...",
    "username": "ramesh_farmer",
    "role": "farmer"
  },
  "profile": {
    "preferred_language": "hi",
    "village": "Kanchrol",
    "district": "Nadia",
    "state": "West Bengal"
  }
}
```

### 1.3 Get Current User Profile 🔒
- **Endpoint:** `GET /api/v1/auth/me`
- **Auth:** Required

---

## 2. Farms & Crop Cycles (`/api/v1/farms`, `/api/v1/crops`)

### 2.1 List All Farms 🔒
- **Endpoint:** `GET /api/v1/farms`
- **Response `200 OK`:**
```json
{
  "farms": [
    {
      "id": "farm-uuid-1",
      "name": "North Field (Uttar Khet)",
      "size_acres": 3.5,
      "soil_type": "alluvial",
      "irrigation_source": "tube_well",
      "latitude": 23.472,
      "longitude": 88.556
    }
  ]
}
```

### 2.2 Create Farm 🔒
- **Endpoint:** `POST /api/v1/farms`
- **Request Body:**
```json
{
  "name": "River Plot",
  "size_acres": 2.0,
  "soil_type": "clay_loam",
  "irrigation_source": "canal",
  "latitude": 23.472,
  "longitude": 88.556
}
```

### 2.3 List Crop Cycles 🔒
- **Endpoint:** `GET /api/v1/crops`
- **Query Params:** `farm_id` (optional), `status` (active / harvested)
- **Response `200 OK`:**
```json
{
  "crops": [
    {
      "id": "crop-uuid-1",
      "farm_id": "farm-uuid-1",
      "farm_name": "North Field",
      "crop_name": "Paddy (Dhan)",
      "variety": "Swarna (MTU 7029)",
      "sowing_date": "2026-06-15",
      "expected_harvest_date": "2026-11-20",
      "stage": "flowering",
      "status": "active"
    }
  ]
}
```

---

## 3. Crop Issues & ICAR Advisory (`/api/v1/issues`, `/api/v1/chat`)

### 3.1 Report Crop Issue 🔒
- **Endpoint:** `POST /api/v1/issues`
- **Request Body:**
```json
{
  "crop_cycle_id": "crop-uuid-1",
  "issue_type": "disease",
  "symptoms_reported": "Yellow lesions with wavy margins on leaf tips spreading downwards",
  "severity": "moderate",
  "photo_url": "/api/v1/uploads/crop_photo_123.jpg"
}
```
- **Response `201 Created`:**
```json
{
  "issue": {
    "id": "issue-uuid-1",
    "diagnosis": "Bacterial Leaf Blight (Xanthomonas oryzae)",
    "recommendation": "Drain standing water immediately. Apply Pseudomonas fluorescens spray @ 10g/L.",
    "scientific_source": "ICAR-NRRI Cuttack",
    "follow_up_scheduled_date": "2026-10-31"
  }
}
```

### 3.2 Conversational AI Advisory (OpenRouter LLM + ICAR RAG) 🔒
- **Endpoint:** `POST /api/v1/chat`
- **Request Body:**
```json
{
  "query": "My wheat leaves have yellow stripes and powdery spots",
  "language": "hi",
  "crop_cycle_id": "optional-crop-uuid",
  "audio_requested": true
}
```
- **Response `200 OK`:**
```json
{
  "response_text": "गेहूं में पीले धब्बे येलो रस्ट (Yellow Rust) के लक्षण हो सकते हैं...",
  "diagnosis": "Yellow Rust (Puccinia striiformis)",
  "non_chemical_measures": [
    "खेत में अतिरिक्त जलभराव न होने दें",
    "प्रतिरोधी किस्मों का उपयोग करें"
  ],
  "audio_base64": "UklGRi...",
  "source_attribution": "ICAR-IIWBR Karnal"
}
```

---

## 4. Voice Processing (`/api/v1/voice`)

### 4.1 Speech-to-Text (Gnani Prisma STT) 🔒
- **Endpoint:** `POST /api/v1/voice/transcribe`
- **Content-Type:** `multipart/form-data` or `application/json` (Base64 audio)
- **Parameters:**
  - `audio`: Audio file (WAV / MP3 / OGG, 16kHz recommended)
  - `language`: Target language code (`hi`, `bn`, `ta`, `te`, etc.)
- **Response `200 OK`:**
```json
{
  "transcript": "আমার ধানের পাতায় হলুদ দাগ দেখা দিয়েছে",
  "detected_language": "bn",
  "confidence": 0.94
}
```

### 4.2 Text-to-Speech (Gnani Timbre TTS) 🔒
- **Endpoint:** `POST /api/v1/voice/synthesize`
- **Request Body:**
```json
{
  "text": "আপনার জমিতে অতিরিক্ত জল জমে থাকলে অবিলম্বে নিষ্কাশন করুন।",
  "language": "bn",
  "gender": "female"
}
```
- **Response `200 OK`:**
```json
{
  "audio_url": "/api/v1/voice/cache/tts_hash_123.wav",
  "audio_base64": "UklGRi..."
}
```

---

## 5. Weather & IMD Hazard Alerts (`/api/v1/weather`)

### 5.1 Get Weather Forecast & IMD Alerts 🔒
- **Endpoint:** `GET /api/v1/weather`
- **Query Params:**
  - `farm_id` (optional): Fetch weather for a registered farm's coordinates
  - `lat`, `lon` (optional): Override coordinates (browser GPS)
- **Response `200 OK`:**
```json
{
  "location": {
    "latitude": 23.472,
    "longitude": 88.556,
    "source": "gps_auto_detected"
  },
  "current": {
    "temperature": 32.4,
    "humidity": 78,
    "wind_speed": 14.2,
    "condition": "Partly Cloudy",
    "rain_mm": 0.0
  },
  "forecast": [
    {
      "date": "2026-10-29",
      "temp_max": 34.0,
      "temp_min": 24.5,
      "rain_sum_mm": 72.4,
      "hazard_alert": {
        "level": "WARNING",
        "category": "Heavy Rainfall (IMD Criteria)",
        "advisory": "Rainfall >= 64.5mm expected. Clear field drainage channels."
      }
    }
  ]
}
```

---

## 6. Proactive Follow-Ups & Notifications (`/api/v1/follow-ups`)

### 6.1 Get Pending Follow-Ups 🔒
- **Endpoint:** `GET /api/v1/follow-ups`
- **Query Param:** `status=pending`
- **Response `200 OK`:**
```json
{
  "follow_ups": [
    {
      "id": "task-uuid-1",
      "issue_id": "issue-uuid-1",
      "crop_name": "Paddy",
      "diagnosis": "Bacterial Leaf Blight",
      "scheduled_date": "2026-10-31",
      "prompt_question": "Did the yellow lesions stop spreading after draining water?"
    }
  ]
}
```

### 6.2 Submit Follow-Up Feedback 🔒
- **Endpoint:** `POST /api/v1/follow-ups/:id/feedback`
- **Request Body:**
```json
{
  "outcome": "improved",
  "notes": "Lesions turned dry and brown, no new leaves affected",
  "photo_url": null
}
```
