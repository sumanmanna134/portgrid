# PortGrid Operations Guide: Development, QA, and Production

This document outlines the end-to-end workflow for developing, testing, verifying, and releasing PortGrid across the three standard deployment tiers: Development (`dev`), Quality Assurance (`qa`), and Production (`prod`).

---

## 1. Architecture Overview

```
Feature Branch
      │
      ▼
dev branch (Push / PR)
      │  └── CI/CD: Compile -> Trivy CVE Scan -> Push mannasuman134/postgrid:dev
      ▼
qa branch (Merge PR)
      │  └── CI/CD: Compile -> Trivy CVE Scan -> Push mannasuman134/postgrid:qa
      ▼
main branch (Merge PR)
         └── CI/CD: Compile -> Trivy CVE Scan
                     -> Push mannasuman134/postgrid:latest & :v<version>
                     -> Publish @portgrid/cli to NPM
                     -> Create GitHub Release v<version>
```

### Environment Specifications

| Environment | Git Branch | Docker Hub Image Tag | PortGrid CLI Flag | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Development** | `dev` | `mannasuman134/postgrid:dev` | `portgrid up --dev` | Daily coding, rapid iteration, live hot-reloading |
| **QA / Staging** | `qa` | `mannasuman134/postgrid:qa` | `portgrid up --qa` | Integration validation, pre-release signoff |
| **Production** | `main` | `mannasuman134/postgrid:latest` | `portgrid up` | Public NPM package & stable production image |

---

## 2. GitHub Secrets Configuration

To enable automated Docker Hub and NPM publishing in GitHub Actions, navigate to **Settings -> Secrets and variables -> Actions** in your GitHub repository and define:

1. **`DOCKERHUB_USERNAME`**: Your Docker Hub username (e.g., `mannasuman134`).
2. **`DOCKERHUB_TOKEN`**: A Docker Hub Personal Access Token with Read & Write access.
3. **`NPM_TOKEN`**: An NPM Automation token authorized to publish under your `@portgrid` organization.

*(Note: `GITHUB_TOKEN` is automatically provisioned by GitHub Actions to generate releases).*

---

## 3. Tier 1: Development Workflow (`dev`)

### 3.1 Running Local Development

Development mode runs frontend Vite in HMR mode and NestJS backend in TypeScript watch mode:

```bash
# Option A: Unified startup script
./start.sh dev

# Option B: Dedicated developer script
./start-dev.sh

# Option C: Run containerized dev image via CLI
portgrid up --dev
```

### 3.2 Development Endpoints
- **Web Console UI:** `http://localhost:3000`
- **Backend API:** `http://localhost:4000/api`
- **Swagger Documentation:** `http://localhost:4000/api/docs`

### 3.3 Validating Changes Locally
Before committing changes to the `dev` branch, run the local compilation suite:

```bash
# 1. Compile backend and frontend distributions
npm run build

# 2. Test CLI packaging tarball
npm pack --dry-run

# 3. Check for dependency advisories
npm audit --audit-level=high
```

### 3.4 Pushing to Development Branch
```bash
git checkout dev
git add .
git commit -m "feat: implement new service blueprint"
git push origin dev
```

**Automated Action:** GitHub Actions compiles the code, performs a Trivy security audit, builds the container image, and pushes `mannasuman134/postgrid:dev` to Docker Hub.

---

## 4. Tier 2: Quality Assurance Workflow (`qa`)

The QA environment mirrors production builds. It is used to test container orchestration, database blueprints, socket isolation, and FIPS cryptographic integrity.

### 4.1 Promoting Changes to QA Branch
```bash
# Merge dev into qa
git checkout qa
git merge dev
git push origin qa
```

**Automated Action:** GitHub Actions verifies tests, scans the image with Trivy, and pushes `mannasuman134/postgrid:qa` to Docker Hub.

### 4.2 Running the QA Environment Locally

```bash
# Option A: Pull and run the official QA container from Docker Hub
./start.sh qa

# Option B: Dedicated QA helper script
./start-qa.sh

# Option C: Test local compiled bundle with NODE_ENV=qa (offline)
./start.sh qa --local

# Option D: Configure PortGrid CLI to target QA image
portgrid env qa
portgrid up
```

### 4.3 QA Verification Checklist
Perform these checks in the running QA environment:

1. **System Health:** Run `portgrid doctor` to ensure hardware, socket translation, and ports pass.
2. **Database Provisioning:** Deploy a sample service (`portgrid deploy postgres` or `portgrid deploy mongodb`).
3. **Companion UI:** Open `http://localhost:8081` (for Mongo Express) or `http://localhost:5050` (for pgAdmin) to verify zero-port-conflict connectivity.
4. **Cryptographic Ledger:** Run `portgrid audit verify` to confirm Merkle tree mathematical integrity.
5. **FIPS 140-2 Secret Vault:** Run `portgrid vault status` to ensure secrets are encrypted using AES-256-GCM.

---

## 5. Tier 3: Production Release Workflow (`prod` / `main`)

Production releases occur strictly upon merging into the `main` branch.

### 5.1 Step-by-Step Release Procedure

#### Step 1: Bump the Package Version
In the root `package.json`, increment the semantic version:
```bash
# Bump patch (e.g. 1.2.5 -> 1.2.6)
npm version patch --no-git-tag-version

# Or bump minor (e.g. 1.2.5 -> 1.3.0)
npm version minor --no-git-tag-version
```

#### Step 2: Open and Merge a Pull Request into `main`
Create a Pull Request from `qa` into `main`:
1. Verify that all automated CI checks in the Pull Request pass.
2. Complete code review approval.
3. Merge the Pull Request into `main`.

#### Step 3: Automated Production CI/CD Execution
Once merged into `main`, GitHub Actions automatically:
1. Compiles production frontend and backend assets.
2. Runs Aqua Security Trivy static vulnerability scans.
3. Builds the production Docker image and publishes tags:
   - `mannasuman134/postgrid:latest`
   - `mannasuman134/postgrid:prod`
   - `mannasuman134/postgrid:v<version>`
4. Publishes `@portgrid/cli` to the public NPM registry (`npm publish --access public`).
5. Generates an official GitHub Release with release notes and the `v<version>` tag.

### 5.2 Verifying the Production Release

Users across macOS, Linux, and Windows can immediately consume the production release:

```bash
# Global install from npm registry
npm install -g @portgrid/cli

# Or instant zero-install execution
npx @portgrid/cli up

# View running container status
portgrid ps
```

---

## 6. PortGrid CLI Multi-Environment Commands Reference

The PortGrid CLI includes built-in support for switching between environments without editing configuration files:

```bash
# Inspect current active environment
portgrid env

# Switch default CLI environment
portgrid env dev       # Points to mannasuman134/postgrid:dev
portgrid env qa        # Points to mannasuman134/postgrid:qa
portgrid env prod      # Points to mannasuman134/postgrid:latest

# One-off launches bypassing the default setting
portgrid up --dev      # Launch dev container
portgrid up --qa       # Launch QA container
portgrid up --prod     # Launch prod container

# Refresh container image for a specific environment
portgrid update --qa
portgrid update --dev
```

---

## 7. Troubleshooting & FAQ

### Port 3000 or 4000 is Already Bound
If a zombie process holds port 3000 or 4000:
```bash
./start.sh dev
```
*(The startup script automatically detects occupied ports and releases them cleanly before booting).*

### Docker Daemon Inaccessible
If `portgrid doctor` reports an inactive Docker daemon:
- **macOS:** Run `open -a Docker` (or `open -a OrbStack` / `colima start`).
- **Linux:** Run `sudo systemctl start docker`.
- **Windows:** Launch Docker Desktop from the Start menu.

### Podman Support
PortGrid supports Podman out of the box. To route the CLI to Podman:
```bash
# macOS
podman machine start

# Linux
systemctl --user enable --now podman.socket
export DOCKER_HOST="unix://$XDG_RUNTIME_DIR/podman/podman.sock"
```
