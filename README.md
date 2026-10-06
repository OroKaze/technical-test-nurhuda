# Dexa Group - Fullstack Web Technical Test

> **Work From Home (WFH) Attendance & Employee Management Platform**  
> Built as an enterprise-grade, distributed microservice architecture with asynchronous event-driven messaging, NestJS API Gateway, and React 19 Single Page Applications.

---

## 🏗️ Architecture & System Design

The system implements a production-ready, domain-driven microservices pattern with strict boundaries and containerized deployment:

```
                  ┌───────────────────────┐
                  │      Browser UI       │
                  │ Employee Web (:3001)  │
                  │   HRD Web    (:3002)  │
                  └───────────┬───────────┘
                              │ HTTP / REST
                              ▼
                  ┌───────────────────────┐
                  │      API Gateway      │
                  │   (NestJS / :3000)    │
                  │  Auth Proxy, Uploads, │
                  │     SSE Push Proxy    │
                  └───────────┬───────────┘
                              │ Internal Network
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Identity Service │ │ Employee Service │ │Attendance Service│
│ (Auth / Users)   │ │ (Profiles / CRUD)│ │(Check-in / Out)  │
└────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
         │                    │                    │
         ├────────────────────┴────────────────────┤
         │      Transactional Outbox Table         │
         │                    ▼                    │
         │          RabbitMQ Message Broker        │
         │                    │                    │
         │                    ▼                    │
         │           ┌──────────────────┐          │
         └──────────>│   Event Worker   │<─────────┘
                     │ (Async Consumer) │
                     └──────────────────┘
```

### Key Architectural Highlights
1. **Isolated Microservice Boundaries:** Services communicate synchronously via the API Gateway and asynchronously via **RabbitMQ** using the **Transactional Outbox Pattern** to prevent dual-write anomalies.
2. **Database Segregation:** Dedicated PostgreSQL schemas (`identity`, `employee`, `attendance`) ensure bounded context isolation. PostgreSQL is strictly internal to the Docker network.
3. **Secure Static Serving:** Uploaded profile photos are stored in a persistent Docker volume (`employee_uploads`) and proxied through the API Gateway with strict UUID validation (`^[a-f0-9-]+\.(jpg|png|webp)$`) to prevent directory traversal attacks.
4. **Enforced Timezone Consistency:** All attendance records and frontend displays strictly enforce `Asia/Jakarta` (WIB, UTC+7) across database transactions, service layers, and UI clocks.
5. **Security by Default:** Passwords hashed with **Argon2id**, JWT bearer tokens with role claims (`EMPLOYEE`, `HRD`), non-root container execution (`USER app`), and role-based route guards on both Gateway and Frontend.

---

## 🌐 Service Topology & Ports

| Service | Host Port | Internal Port | Access Level | Description |
|---|---|---|---|---|
| **API Gateway** | `3000` | `3000` | Public | Reverse proxy, authentication validation, photo upload & proxy, SSE notification stream |
| **Employee Web** | `3001` | `80` (Nginx) | Public | SPA for employees: live attendance check-in/out, monthly summary, profile & photo management |
| **HRD Web** | `3002` | `80` (Nginx) | Public | SPA for HRD admins: employee master data CRUD, company-wide read-only attendance monitoring |
| **Identity Service** | — | `3001` | Internal | User credentials, Argon2id hashing, JWT token issuance, password updates |
| **Employee Service** | — | `3002` | Internal | Employee master profiles, phone number updates, photo storage handling |
| **Attendance Service** | — | `3003` | Internal | Check-in / check-out idempotency, daily pair merging, monthly attendance summaries |
| **Event Worker** | — | `3004` | Internal | Outbox publisher & RabbitMQ queue consumers for cross-service events |
| **PostgreSQL** | — | `5432` | Internal | Relational database hosting schemas `identity`, `employee`, and `attendance` |
| **RabbitMQ** | `15672` (Dev) | `5672` | Internal / UI | Message broker. Management UI: `http://localhost:15672` (Login: `guest` / `guest` atau `dexa` / `replace-me`) |

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose (v2.20+)
- [Node.js](https://nodejs.org/) (v22+)
- [pnpm](https://pnpm.io/) (v10+)

### 1. Clone & Configure Environment
```bash
# Copy example environment configuration
cp .env.example .env
```

### 2. Build and Start All Containers
```bash
docker compose up -d --build
```
> All 9 services will compile, run health checks, and start up in the background.

### 3. Seed Database
Seed the databases with initial development accounts and baseline employee data:
```bash
pnpm docker:seed
```
*Note: The seed script executes directly inside the running `identity-service` and `employee-service` containers, keeping PostgreSQL credentials safe inside the internal Docker network. The script is idempotent and safe to run multiple times.*

### 4. Development Credentials

| Role | Email | Password | Allowed Portals |
|---|---|---|---|
| **Employee** | `employee@company.example` | `Employee123!` | Employee Web (`http://localhost:3001`) |
| **HRD** | `hrd@company.example` | `HrdEmployee123!` | HRD Web (`http://localhost:3002`) & Employee Web |

---

## 🧪 Testing & Verification

The project includes multi-layer automated verification suites across all monorepo workspaces:

### 1. Monorepo Typecheck
Verifies TypeScript strict type correctness across backend services, packages, and frontend:
```bash
pnpm typecheck
```

### 2. Unit & Integration Tests
Runs Node.js native test runners across all services (`api-gateway`, `attendance-service`, `web`):
```bash
pnpm test
```
*Result: 30/30 tests pass (including attendance daily merging logic, API error normalization, and timezone conversion).*

### 3. Automated End-to-End Smoke Test
Executes a live end-to-end operational suite against the running Docker containers:
```bash
pnpm test:smoke
```
**Smoke Test Checklist (9/9 Steps):**
- [x] Gateway Health status (`/api/v1/health/live`)
- [x] Employee JWT authentication
- [x] Employee profile fetch
- [x] Employee phone number update
- [x] Multipart profile photo upload & secure proxy retrieval
- [x] Attendance check-in idempotency (duplicate prevention returns HTTP 409)
- [x] Attendance date-range summary query (`?from=&to=`)
- [x] HRD JWT authentication
- [x] HRD employee listing & read-only attendance monitoring

---

## 💻 Frontend Application Details

The frontend client (`apps/web`) is built with React 19, TypeScript, and Vite, styled using a modern, cohesive Corporate Navy & Teal design system. It compiles into two distinct Nginx-hosted production containers:

### Employee Portal (`http://localhost:3001`)
- **Live Digital Clock:** Real-time WIB clock displaying current date and time.
- **Attendance Actions:** Check-In and Check-Out buttons with instant confirmation and error banners.
- **Attendance Summary:** Date-filtered summary table (`from` / `to`) displaying paired Check-In & Check-Out times, duration, and status tags.
- **Profile & Photo Upload:** Profile card with avatar image preview, phone number editor, and client-side validated photo uploader (PNG/JPG/WEBP, max 5MB).
- **Password Management:** Self-service modal to update user password with new credentials.
- **Real-Time Notifications:** Server-Sent Events (SSE) listener with non-intrusive toast popups.

### HRD Portal (`http://localhost:3002`)
- **Employee Master Management:** Full CRUD interface for employees with search, pagination, and modal dialogs to register new personnel or modify existing profiles.
- **Attendance Monitoring:** Read-only company-wide attendance monitoring log with employee and date filtering.
- **Role Guarding:** Strictly restricts access to HRD role users; unauthorized access redirects automatically.

---

## 📂 Project Structure

```
├── apps/
│   ├── api-gateway/            # NestJS API Gateway & reverse proxy
│   ├── attendance-service/     # Attendance domain (check-in/out, summary)
│   ├── employee-service/       # Employee master data & photo storage
│   ├── event-worker/           # RabbitMQ outbox & event subscriber worker
│   ├── identity-service/       # Authentication, credentials, JWT & Argon2id
│   └── web/                    # React 19 + Vite SPA (Employee & HRD portals)
├── docker/
│   └── postgres/init/          # DB initialization schemas (identity, employee, attendance)
├── packages/
│   ├── common/                 # Shared types, error classes, and DTOs
│   └── rabbitmq/               # Shared RabbitMQ connection & publisher helpers
├── scripts/
│   └── smoke-test.mjs          # End-to-end integration smoke test suite
├── compose.yaml                # Multi-service Docker Compose configuration
└── package.json                # Monorepo root scripts & tooling
```

---

## 🛡️ Definition of Done Compliance

- [x] **All 9 services build and run** via `docker compose up -d --build`.
- [x] **Database seeds are idempotent** and execute safely inside containers via `pnpm docker:seed`.
- [x] **Clean code principles applied:** modular, strongly typed, and well-documented.
- [x] **Multi-stage Docker builds** with non-root security (`USER app`) across all images.
- [x] **100% test pass rate** for `pnpm typecheck`, `pnpm test`, and `pnpm test:smoke`.
- [x] **Git repository hygiene:** Local architecture specs and environment files remain untracked.
