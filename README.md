# PortGrid ⚡
> **Local Cloud Infrastructure Platform & Ephemeral Service Orchestrator**

PortGrid is a self-hosted developer platform that eliminates the complexity of configuring, wiring, and managing database and messaging infrastructure for local and team environments.

---

## 🎯 Key Capabilities

- **Bank-Grade & Critical Fintech Security:**
  - **FIPS 140-2 AES-256-GCM Envelope Encryption**: Sensitive credentials encrypted at rest with authenticated 128-bit tags and 256-bit master key isolation.
  - **Maker-Checker Dual Control (Four-Eyes Principle)**: Destructive de-provisioning requires explicit dual-authorization tickets (`#TKT-XXXX`) approved by a designated Security Checker.
  - **NIST SP 800-88 Rev 1 Cryptographic Shredding**: In-memory credential zeroing (`Buffer.fill(0)`), key purging, and volume destruction with verifiable cryptographic receipts.
  - **Tamper-Evident SHA-256 Merkle Audit Ledger**: Immutable, cryptographic hash-chained audit trail (`data/audit.log`) with live integrity verification.
  - **Strict Loopback Network Isolation**: Container daemons bind strictly to `127.0.0.1`, preventing LAN probes or corporate Wi-Fi snooping.
  - **Linux SecurityOpt Container Hardening**: Prevents kernel privilege escalation via `no-new-privileges`.
  - **Enterprise HTTP Hardening**: Enforces strict HSTS, CSP, and security headers.
- **Custom Service Onboarding Workflow Editor:**
  - Visual two-column workflow designer with interactive form controls and bidirectional JSON editor.
  - Full schema validation, real-time error indicators, and support for multi-container companion setups.
- **1-Click Paired Deployment:**
  - Installs backend engines alongside matched companion administration consoles (e.g. PostgreSQL + pgAdmin, Kafka + Kafka UI, Redis + Redis Commander).
- **Dynamic Port Allocation & Conflict Prevention:**
  - Detects occupied ports and dynamically assigns free host loopback ports.
- **Live Container Telemetry & Status Sync:**
  - Actively synchronizes container health with Docker daemon states (`Live` vs `Offline`).
  - Real-time CPU, memory usage, and streaming logs.

---

## 📦 Built-In Infrastructure Blueprints

| Service | Engine Image | Companion Web UI | Features |
| :--- | :--- | :--- | :--- |
| **PostgreSQL 16** | `postgres:16-alpine` | **pgAdmin 4** (`dpage/pgadmin4`) | One-click `.env` export, Spring JDBC URL, auto-generated vault credentials |
| **Apache Kafka** | `apache/kafka:3.7.0` | **Kafka UI** (`provectuslabs/kafka-ui`) | Modern KRaft mode (no Zookeeper required), topic browser |
| **Redis 7** | `redis:7-alpine` | **Redis Commander** | Key-value viewer, protected password auth |
| **Keycloak 24** | `quay.io/keycloak/keycloak:24.0.2` | Native Admin Console | Dev-mode OAuth2 / OIDC IAM identity server |
| **Jenkins** | `jenkins/jenkins:lts-jdk17` | Native Web Dashboard | Pre-configured local CI/CD automation server |
| **RabbitMQ 3.13** | `rabbitmq:3.13-management-alpine` | RabbitMQ Management Console | AMQP message broker with live queue management |

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v18+)
- **Docker Desktop / Docker Engine** (running locally)

### 2. Start PortGrid
From the root directory:

```bash
./start.sh
```

Or start manually:
```bash
# Terminal 1: Control Plane Backend (NestJS on port 4000)
npm run dev:backend

# Terminal 2: Dashboard Frontend (Vite + React on port 3000)
npm run dev:frontend
```

Access the interfaces:
* **Web Dashboard:** [http://localhost:3000](http://localhost:3000)
* **Control Plane API:** [http://localhost:4000/api](http://localhost:4000/api)

---

## 🧩 Architectural Design

```
portgrid/
├── backend/                   # NestJS Control Plane & Security Engine
│   ├── src/
│   │   ├── audit/            # SHA-256 Merkle Chained Audit Ledger
│   │   ├── catalog/          # Blueprints & Custom Service Catalog
│   │   ├── docker/           # Dockerode Engine, NNP Hardening, Metrics
│   │   ├── governance/       # Maker-Checker Dual Authorization Engine
│   │   ├── services/         # Orchestration & NIST SP 800-88 Crypto-Shredder
│   │   ├── vault/            # AES-256-GCM Envelope Encryption & Credentials
│   │   ├── app.module.ts
│   │   └── main.ts           # Enterprise HTTP Security Headers
│   └── package.json
├── frontend/                  # React + Vite + Tailwind CSS (Apple / Google Design)
│   ├── src/
│   │   ├── components/       # AuditModal, ServiceCard, CatalogCard, WorkflowEditorModal
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── start.sh                   # Unified startup script
└── README.md
```
