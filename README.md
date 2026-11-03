# Hotel Rama Inn - Booking Engine & Management System

Hotel Rama Inn is a full-featured hotel booking backend engine built with **FastAPI**, **SQLAlchemy (PostgreSQL)**, **Redis**, and payment gateway orchestration (**Razorpay / Stripe**).

---

## Features

- **Room Catalog & Capacity Management**: Categories, pricing, adult/child occupancy limits, amenities, and media gallery.
- **Accurate Real-Time Availability Engine**: Prevents double-booking using the standard half-open interval overlap algorithm:
  `(check_in < requested_check_out) AND (check_out > requested_check_in)`
- **Reservation Hold & Concurrency Control**:
  - Distributed Redis locking during checkout initiation to prevent race conditions on last available units.
  - 10-minute temporary inventory reservation hold (`PENDING_PAYMENT` status).
- **Payment Gateway Orchestration**:
  - Supports Razorpay and Stripe order creation.
  - Authoritative webhook endpoint (`/api/payments/webhook`) with cryptographic HMAC signature verification.
  - Client-side checkout callback verification (`/api/payments/verify`).
- **Automated Background Tasks**:
  - Dispatches HTML booking voucher confirmations to guest emails.
  - Automatic cleanup worker: periodically cancels/expires abandoned bookings older than 10 minutes and frees inventory.
- **RESTful API Documentation**: Interactive OpenAPI/Swagger UI at `/api/docs`.

---

## Tech Stack & Prerequisites

- **Python**: 3.11+ (Python 3.12 / 3.13 / 3.14 supported)
- **Database**: PostgreSQL
- **Cache & Locks**: Redis
- **Framework**: FastAPI + Uvicorn
- **ORM & Migrations**: SQLAlchemy 2.0 (async via `asyncpg`) + Alembic (`psycopg` binary driver)

---

## Getting Started

### 1. Clone or Navigate to the Repository

```bash
cd /Users/shivamgupta/Documents/hotelRamaiNnproject
```

### 2. Set Up Python Virtual Environment

```bash
cd backend

# Create virtual environment (if not already created)
python3 -m venv venv

# Activate virtual environment
# On macOS / Linux:
source venv/bin/activate

# On Windows:
# venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

## Configuration (`.env`)

Inside `backend/`, copy `.env.example` to `.env` (or update existing `backend/.env`):

```bash
cp .env.example .env
```

Review and adjust the configuration parameters:

```env
# ── App ──────────────────────────────────────────────────────────────────────
APP_NAME="Hotel Rama Inn"
DEBUG=true
SECRET_KEY=your-secure-random-secret-key
ALLOWED_ORIGINS=["http://localhost:5173","http://localhost:3000"]

# ── Database ──────────────────────────────────────────────────────────────────
# Async URL used by the FastAPI application:
DATABASE_URL=postgresql+asyncpg://rama:rama@localhost:5432/rama_inn
# Synchronous URL used by Alembic migrations:
SYNC_DATABASE_URL=postgresql+psycopg://rama:rama@localhost:5432/rama_inn

# ── Redis ─────────────────────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379/0

# ── Razorpay (or test credentials) ───────────────────────────────────────────
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# ── Stripe (Alternative / Optional) ───────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# ── Email / SMTP (Confirmation Vouchers) ─────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@hotelramainn.com

# ── Inventory Hold TTL ───────────────────────────────────────────────────────
BOOKING_HOLD_MINUTES=10
```

> **Note on Local Development without Redis / SMTP / Live Payment Keys:**
> The backend gracefully handles local mock environments:
> - If Redis is temporarily unreachable, it logs a warning and relies on database-level row transaction locking.
> - If live Razorpay/Stripe keys are omitted, test mock order IDs and simulated signatures are supported.
> - If SMTP credentials are empty, email vouchers are formatted and logged locally without throwing errors.

---

## Database Setup & Migrations

Make sure PostgreSQL is running and the database exists:

```bash
# Example creating the database in PostgreSQL:
createdb rama_inn
# Or via psql:
# psql -U postgres -c "CREATE DATABASE rama_inn;"
```

Generate and apply Alembic migrations:

```bash
cd backend
source venv/bin/activate

# Generate initial migration (if modifying models)
alembic revision --autogenerate -m "Initial schema"

# Apply migrations to database
alembic upgrade head
```

---

## Running the Application

### Start FastAPI Development Server

From inside `backend/`:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The server will start on: **`http://localhost:8000`**

- **Interactive API Documentation (Swagger)**: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
- **Alternative ReDoc UI**: [http://localhost:8000/api/redoc](http://localhost:8000/api/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

*(The lifespan manager automatically runs the periodic cleanup loop in the background to expire abandoned booking holds).*

---

## Running the Abandoned Booking Cleanup Worker Standalone

FastAPI automatically runs the cleanup loop inside `lifespan` on server startup. If you prefer to run the worker independently (e.g. as a separate systemd service or cron job):

```bash
cd backend
source venv/bin/activate
python -m app.services.cleanup_worker
```

---

## Running Tests

Execute unit and integration test suites using `pytest`:

```bash
cd backend
source venv/bin/activate
pytest -v
```

To run a specific test suite:

```bash
# Test date overlap algorithm & room availability logic:
pytest tests/test_availability.py -v

# Test payment order generation & cryptographic webhook signatures:
pytest tests/test_payment_orchestration.py -v
```

---

## Key API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/rooms/` | List all active room categories with base pricing & amenities |
| `GET` | `/api/v1/rooms/{slug}` | Detailed view of a specific room category |
| `GET` | `/api/v1/availability` | Check available rooms for dates `?check_in=YYYY-MM-DD&check_out=YYYY-MM-DD&adults=2&children=0` |
| `POST` | `/api/v1/bookings/initiate` | Acquire 10-minute hold, create `PENDING_PAYMENT` booking, and create gateway order |
| `POST` | `/api/v1/payments/verify` | Verify client-side checkout signature callback |
| `POST` | `/api/v1/payments/webhook` | Webhook for payment gateway; verifies HMAC signature, confirms booking, triggers voucher email |
| `GET` | `/api/v1/bookings/lookup/{ref}` | Guest booking status lookup by reference (e.g., `RAMA-202610-A1B2`) |
| `GET` | `/health` | Service health status |

---

## Project Structure

```
hotelRamaiNnproject/
├── README.md                      # This guide
├── context.md                     # System specifications & requirements
└── backend/
    ├── alembic.ini                # Alembic migration configuration
    ├── alembic/                   # Database migration scripts
    ├── pytest.ini                 # Pytest configuration
    ├── requirements.txt           # Python dependencies
    ├── .env.example               # Environment variables template
    ├── .env                       # Local environment settings
    ├── STRUCTURE.md               # Backend structure overview
    ├── app/
    │   ├── main.py                # FastAPI initialization, CORS, lifespan & router mounts
    │   ├── config.py              # Pydantic Settings configuration loader
    │   ├── database.py            # Async SQLAlchemy engine & session dependency
    │   ├── models/                # Database ORM models
    │   │   ├── room.py            # RoomCategory model
    │   │   ├── booking.py         # Booking model & status enums
    │   │   └── payment.py         # PaymentTransaction model
    │   ├── schemas/               # Pydantic validation schemas
    │   │   ├── room.py            # Room request/response schemas
    │   │   ├── booking.py         # Availability & booking schemas
    │   │   └── payment.py         # Webhook & transaction schemas
    │   ├── routers/               # API route handlers
    │   │   ├── rooms.py           # Room listing & management routes
    │   │   ├── bookings.py        # Booking initiation & lookup routes
    │   │   └── payments.py        # Webhook & verification routes
    │   └── services/              # Business logic & integrations
    │       ├── availability.py    # Overlap detection & availability calculations
    │       ├── redis_service.py   # Distributed Redis locking & hold tracking
    │       ├── gateway_service.py # Gateway order generation & HMAC verification
    │       ├── email_service.py   # HTML voucher template & SMTP email sender
    │       └── cleanup_worker.py  # Abandoned booking cancellation worker
    └── tests/                     # Test suites
        ├── test_availability.py
        └── test_payment_orchestration.py
```

