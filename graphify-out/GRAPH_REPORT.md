# Graph Report - infradock  (2026-10-10)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 426 nodes · 839 edges · 16 communities (12 shown, 4 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 62 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4c9be3f7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- services.service.ts
- backend/package.json
- ServicesService
- ServiceBlueprint
- frontend/package.json
- GovernanceService
- 3. Step-by-Step Technical Implementation
- Backend TypeScript Build Config
- Security & Audit Controller Endpoints
- package.json
- PortGrid Platform
- nest-cli.json
- start.sh

## God Nodes (most connected - your core abstractions)
1. `GovernanceService` - 23 edges
2. `ServicesService` - 22 edges
3. `DockerService` - 20 edges
4. `ServiceBlueprint` - 19 edges
5. `CatalogService` - 18 edges
6. `@nestjs/common` - 18 edges
7. `compilerOptions` - 18 edges
8. `AuditService` - 17 edges
9. `ServicesController` - 16 edges
10. `react` - 15 edges

## Surprising Connections (you probably didn't know these)
- `PortGrid Web Application Shell` --references--> `PortGrid Platform`  [EXTRACTED]
  frontend/index.html → README.md
- `CatalogCardProps` --references--> `ServiceBlueprint`  [EXTRACTED]
  frontend/src/components/CatalogCard.tsx → frontend/src/types.ts
- `CredentialsModalProps` --references--> `InstalledServiceInstance`  [EXTRACTED]
  frontend/src/components/CredentialsModal.tsx → frontend/src/types.ts
- `LogsModalProps` --references--> `InstalledServiceInstance`  [EXTRACTED]
  frontend/src/components/LogsModal.tsx → frontend/src/types.ts
- `ServiceCardProps` --references--> `InstalledServiceInstance`  [EXTRACTED]
  frontend/src/components/ServiceCard.tsx → frontend/src/types.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Fintech Security Governance Framework** — readme_fips140_encryption, readme_maker_checker, readme_crypto_shredding, readme_merkle_audit_ledger [EXTRACTED 1.00]

## Communities (16 total, 4 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.07
Nodes (56): App(), AuditLogEntry, AuditModal(), AuditModalProps, VerificationResult, CatalogCard(), CatalogCardProps, getIcon() (+48 more)

### Community 1 - "services.service.ts"
Cohesion: 0.07
Nodes (28): AppModule, AuditModule, AuditLogEntry, VerificationResult, CompanionUiSpec, ContainerSpec, PortMapping, VolumeSpec (+20 more)

### Community 2 - "backend/package.json"
Cohesion: 0.04
Nodes (47): author, dependencies, dockerode, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/platform-express, reflect-metadata (+39 more)

### Community 3 - "ServicesService"
Cohesion: 0.09
Nodes (6): InstalledServiceInstance, DockerService, ServicesService, VaultService, Step 1: Strict Network Isolation & Deterministic Loopback Binding, Step 5: NIST SP 800-88 Rev 1 Cryptographic Erase (CE)

### Community 4 - "ServiceBlueprint"
Cohesion: 0.10
Nodes (3): ServiceBlueprint, CatalogService, ServicesController

### Community 5 - "frontend/package.json"
Cohesion: 0.06
Nodes (33): dependencies, clsx, lucide-react, react, react-dom, tailwind-merge, devDependencies, autoprefixer (+25 more)

### Community 6 - "GovernanceService"
Cohesion: 0.12
Nodes (3): GovernanceController, ApprovalTicket, GovernanceService

### Community 7 - "3. Step-by-Step Technical Implementation"
Cohesion: 0.10
Nodes (19): 1.1 Unrestricted Lateral Exposure (0.0.0.0 Default Bindings), 1.2 The Rogue Operator and Accidental Destruction (Lack of Dual Authorization), 1.3 Plaintext Secret Sprawl and Heap Memory Forensics, 1.4 Residual Media Forensics and Incomplete Decommissioning, 1.5 Non-Auditability and Log Tampering (Flat File Repudiation), 1.6 Privilege Escalation and Container Escapes, 1.7 Management Perimeter Exploitation, 1. Problem Statement: Critical Vulnerabilities in Cloud & Infrastructure Platforms (+11 more)

### Community 8 - "Backend TypeScript Build Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, experimentalDecorators, forceConsistentCasingInFileNames, incremental (+10 more)

### Community 10 - "package.json"
Cohesion: 0.18
Nodes (10): author, description, license, name, scripts, build, dev:backend, dev:frontend (+2 more)

### Community 11 - "PortGrid Platform"
Cohesion: 0.28
Nodes (9): PortGrid Web Application Shell, Built-In Infrastructure Blueprints, NIST SP 800-88 Cryptographic Shredding, FIPS 140-2 AES-256 Envelope Encryption, Loopback Network Isolation, Maker-Checker Dual Control Governance, SHA-256 Merkle Audit Ledger, PortGrid Platform (+1 more)

### Community 12 - "nest-cli.json"
Cohesion: 0.50
Nodes (3): collection, $schema, sourceRoot

## Knowledge Gaps
- **26 isolated node(s):** `typescript`, `@nestjs/cli`, `@nestjs/platform-express`, `@nestjs/schematics`, `reflect-metadata` (+21 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 171 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@nestjs/common` connect `services.service.ts` to `backend/package.json`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **What connects `typescript`, `@nestjs/cli`, `@nestjs/platform-express` to the rest of the system?**
  _26 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0747871158830063 - nodes in this community are weakly interconnected._
- **Why does `DockerService` connect `ServicesService` to `services.service.ts`, `ServiceBlueprint`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Should `services.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0673903211216644 - nodes in this community are weakly interconnected._
- **Why does `3. Step-by-Step Technical Implementation` connect `3. Step-by-Step Technical Implementation` to `ServicesService`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `backend/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.041666666666666664 - nodes in this community are weakly interconnected._