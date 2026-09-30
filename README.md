# 🏢 Cabin Booking System — PostgreSQL & Docker Production Deployment

A production-ready, 3-tier shared meeting room cabin booking management application containerized with **Docker**, **Docker Compose**, **PostgreSQL**, and **Nginx Reverse Proxy**.

---

## 🏗️ Production System Architecture

```text
                                Linux VM / NAS
                                      │
                               Docker Network
                                      │
       ┌──────────────────────────────┼──────────────────────────────┐
       │                              │                              │
     Nginx (Port 80)               Frontend                       Backend
 (Reverse Proxy & Static)      (React 19 / Vite)             (Node.js / Express)
       │                              │                              │
       └──────────────────────────────┴───────────────┬──────────────┘
                                                      │
                                                 PostgreSQL
                                                (Port 5432)
                                                      │
                                              Persistent Volume
                                               (postgres_data)
```

---

## 🚀 Deployment Instructions

### 1. Prerequisites
- Linux VM (Ubuntu/Debian recommended) running on NAS or Standalone Server
- **Docker** (v20.10+) & **Docker Compose** (v2.0+) installed

### 2. Environment Configuration
Copy the example environment file and customize your secrets:
```bash
cp .env.example .env
```
Ensure you update `POSTGRES_PASSWORD`, `JWT_SECRET`, and default administrator credentials in `.env`.

### 3. Build & Start Containers
Start all services in detached mode:
```bash
docker compose up -d --build
```

### 4. Verify Container Status
Check running containers and health checks:
```bash
docker compose ps
```

View aggregated logs:
```bash
docker compose logs -f
```

View specific service logs:
```bash
docker compose logs -f backend
docker compose logs -f postgres
```

---

## 🛠️ Management & Maintenance Commands

### 🟢 Start Services
```bash
docker compose up -d
```

### 🔴 Stop Services
```bash
docker compose down
```

### 🔄 Restart All Services
```bash
docker compose restart
```

### 🔄 Rebuild & Restart
```bash
docker compose up -d --build
```

---

## 🗄️ Database Management & Backup Strategy

### 🌱 Seed Database (Initial Cabins & Demo Data)
```bash
docker exec -it booking_backend npm run seed
```

### ⚠️ Clean / Reset Database (Destructive Operation)
```bash
docker exec -it booking_backend npm run clean
```

### 💾 Backup PostgreSQL Database
To create a timestamped SQL dump of the database stored on your host/NAS filesystem:
```bash
mkdir -p database/backups
docker exec -t booking_postgres pg_dump -U booking_admin -d booking_system > database/backups/booking_system_$(date +%Y-%m-%d_%H-%M).sql
```

### 📥 Restore PostgreSQL Database
To restore the database from an existing SQL backup file:
```bash
cat database/backups/booking_system_YYYY-MM-DD_HH-MM.sql | docker exec -i booking_postgres psql -U booking_admin -d booking_system
```

---

## 🔐 Default Login Credentials

| Role | Email | Default Password |
| :--- | :--- | :--- |
| **Super Admin** | `irfan@thestartuppark.com` | `test@spxirff` |

*(Can be configured via `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` in `.env`)*

---

## 💻 Local Development (Without Docker)

### Run Backend Locally
```bash
cd backend
npm start
```

### Run Frontend Locally
```bash
cd frontend
npm run dev
```
