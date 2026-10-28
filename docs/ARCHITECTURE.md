# KrishiVaani AI Architecture Specification

KrishiVaani AI (कृषिवाणी AI) is a production-grade, multimodal agricultural voice and intelligence platform engineered specifically for Indian smallholder farmers. The system synthesizes real-time regional speech processing, official ICAR/SAU agricultural research retrieval, hyper-local IMD meteorological hazard alerts, and an autonomous memory and follow-up engine across 27 Indian languages.

---

## 1. High-Level System Architecture

```mermaid
flowchart TB
    subgraph ClientLayer ["Farmer Client Layer (Mobile & Desktop)"]
        UI["React 18 + Tailwind CSS SPA"]
        VoiceClient["AudioCapture (WAV/16kHz) & AudioPlayback"]
        Geo["HTML5 Geolocation API"]
    end

    subgraph GatewayLayer ["Reverse Proxy & Web Server"]
        Nginx["Nginx / Vite Reverse Proxy"]
    end

    subgraph AppLayer ["Backend Application Server (Flask WSGI)"]
        API["REST API Layer (/api/v1)"]
        AuthMid["JWT Auth Middleware & RBAC"]
        
        subgraph Services ["Core Intelligence Services"]
            LLM["LLMService (OpenRouter / flint-v1.0)"]
            VoiceService["GnaniService (Prisma STT & Timbre TTS)"]
            Advisory["AdvisoryService (ICAR / SAU RAG Engine)"]
            Weather["WeatherService (IMD Hazard Rules & Open-Meteo)"]
            FollowUp["FollowUpEngine (APScheduler Worker)"]
        end
    end

    subgraph DataLayer ["Data & Storage Layer"]
        DB[(PostgreSQL / SQLite with SQLAlchemy ORM)]
        RAGData["ICAR / SAU Knowledge Base (JSON Verified Packages)"]
        Storage["Local / S3 Upload Storage (Photos & Audio)"]
    end

    subgraph ExternalServices ["External Providers"]
        OpenRouterAPI["OpenRouter AI Gateway"]
        GnaniAPI["Gnani AI Vachana Cloud"]
        MeteoAPI["Open-Meteo Meteorological API"]
    end

    %% Interactions
    UI -->|HTTP / JSON| Nginx
    VoiceClient -->|Audio Stream| Nginx
    Geo -->|GPS Coords| Nginx
    Nginx --> API
    API --> AuthMid
    AuthMid --> Services
    
    LLM --> OpenRouterAPI
    VoiceService --> GnaniAPI
    Weather --> MeteoAPI
    Advisory --> RAGData
    
    Services --> DB
    Services --> Storage
    FollowUp -.->|Checks Pending Tasks| DB
```

---

## 2. Relational Data Architecture

The underlying database is managed via SQLAlchemy ORM with migrations managed by Alembic. All multi-tenant data structures enforce tenant isolation (`user_id = current_user.id`).

```mermaid
erDiagram
    USERS ||--o{ FARMER_PROFILES : has
    USERS ||--o{ FARMS : owns
    FARMS ||--o{ CROP_CYCLES : cultivates
    CROP_CYCLES ||--o{ CROP_ISSUES : reports
    CROP_ISSUES ||--o{ ISSUE_OBSERVATIONS : records
    CROP_ISSUES ||--o{ FOLLOW_UP_TASKS : schedules
    USERS ||--o{ CONVERSATIONS : conducts
    CONVERSATIONS ||--o{ CHAT_MESSAGES : contains
    USERS ||--o{ NOTIFICATIONS : receives

    USERS {
        uuid id PK
        string username UK
        string email UK
        string phone UK
        string password_hash
        string role
        datetime created_at
    }

    FARMER_PROFILES {
        uuid id PK
        uuid user_id FK
        string full_name
        string preferred_language
        string village
        string taluk
        string district
        string state
        string pin_code
        float latitude
        float longitude
        string literacy_level
    }

    FARMS {
        uuid id PK
        uuid user_id FK
        string name
        float size_acres
        string soil_type
        string irrigation_source
        float latitude
        float longitude
    }

    CROP_CYCLES {
        uuid id PK
        uuid farm_id FK
        string crop_name
        string variety
        date sowing_date
        date expected_harvest_date
        string stage
        string status
    }

    CROP_ISSUES {
        uuid id PK
        uuid crop_cycle_id FK
        string issue_type
        string symptoms_reported
        string diagnosis
        string severity
        string status
        date reported_date
    }

    FOLLOW_UP_TASKS {
        uuid id PK
        uuid issue_id FK
        date scheduled_date
        string trigger_event
        string status
        datetime completed_at
    }
```

---

## 3. Multimodal Voice & Reasoning Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as Farmer (Voice Query)
    participant UI as Frontend App
    participant Voice as Gnani Voice Service
    participant Advisor as Advisory & RAG Engine
    participant LLM as OpenRouter LLM
    participant TTS as Gnani Timbre TTS

    Farmer->>UI: Speaks query in native dialect (e.g. Hindi, Bengali, Tamil)
    UI->>Voice: POST /api/v1/voice/transcribe (Audio base64 / WAV)
    Voice-->>UI: Transcribed text query in native script
    UI->>Advisor: POST /api/v1/chat (Transcribed text + context)
    Advisor->>Advisor: Match symptom signatures with verified ICAR/SAU knowledge
    Advisor->>LLM: Prompt with Agronomic Grounding + Farm Context + Safety Directives
    LLM-->>Advisor: Grounded, safety-checked advice with non-chemical IPM & follow-up
    Advisor->>TTS: POST /api/v1/voice/synthesize (Native response text)
    TTS-->>Advisor: Expressive audio WAV stream
    Advisor-->>UI: Response JSON (advice text, audio URL, follow-up metadata)
    UI->>Farmer: Plays audio response & renders bilingual cards
```

---

## 4. Meteorological Hazard Engine

KrishiVaani automatically tracks hyper-local weather at farm GPS coordinates using Open-Meteo's meteorological models and evaluates official **India Meteorological Department (IMD)** hazard thresholds:

| Hazard Category | IMD Meteorological Criterion | Automated Farmer Advisory |
|---|---|---|
| **Heavy Rainfall** | Precipitation $\ge 64.5\text{ mm/day}$ | Clear field drainage channels immediately; pause foliar sprays and nitrogen fertilization to prevent runoff. |
| **Very Heavy Rainfall** | Precipitation $\ge 115.6\text{ mm/day}$ | Evacuate low-lying fields, store harvested produce on elevated platforms, safeguard machinery. |
| **Heatwave Warning** | Max Temp $\ge 40^\circ\text{C}$ in plains, departure $+4.5^\circ\text{C}$ | Apply evening light irrigation or micro-sprinklers; avoid midday chemical spraying to prevent leaf scorching. |
| **High Wind Alert** | Wind Speed $\ge 45\text{ km/h}$ | Provide staking for banana/papaya, postpone aerial drone sprays, inspect polyhouse tie-downs. |

---

## 5. Multilingual Translation Subsystem

The application supports **27 Indian native languages and dialects**:
- **Official Constitutional Languages (8th Schedule):** Hindi, Bengali, Telugu, Marathi, Tamil, Gujarati, Punjabi, Kannada, Malayalam, Odia, Assamese, Urdu, Maithili, Sanskrit, Konkani, Nepali, Sindhi, Kashmiri, Dogri, Manipuri (Meitei), Bodo, Santali.
- **Widespread Rural Dialects & Regional Variants:** Bhojpuri, Marwari, Chhattisgarhi, Haryanvi, and Indian English.

The architecture uses a unified key dictionary (`translations.ts`) coupled with language persistence in `FarmerProfile` and `localStorage`, ensuring zero flash-of-unstyled-language on reloads.
