# Graph Report - infradock  (2026-10-10)

## Corpus Check
- 56 files · ~27,236 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 404 nodes · 814 edges · 17 communities (12 shown, 5 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 60 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `49554ea0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Frontend React Dashboard & Modals
- Audit & Catalog Core Models
- Docker Engine Runtime & Deployment
- Governance & Dual-Approval Controller
- Backend Infrastructure Dependencies
- Frontend UI Dependencies
- Catalog & Metrics Orchestration
- NestJS Control Plane Modules
- Backend TypeScript Build Config
- Security & Audit Controller Endpoints
- Backend Dev Tooling
- Root Monorepo Manifest
- Fintech Security Governance Concepts
- Nest CLI Scaffolding Config
- Platform Startup Scripts

## God Nodes (most connected - your core abstractions)
1. `GovernanceService` - 23 edges
2. `ServicesService` - 22 edges
3. `DockerService` - 20 edges
4. `ServiceBlueprint` - 19 edges
5. `@nestjs/common` - 18 edges
6. `CatalogService` - 18 edges
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

## Communities (17 total, 5 thin omitted)

### Community 0 - "Frontend React Dashboard & Modals"
Cohesion: 0.08
Nodes (55): App(), AuditLogEntry, AuditModal(), AuditModalProps, VerificationResult, CatalogCard(), CatalogCardProps, getIcon() (+47 more)

### Community 1 - "Audit & Catalog Core Models"
Cohesion: 0.09
Nodes (20): AuditLogEntry, VerificationResult, CompanionUiSpec, ContainerSpec, PortMapping, ServiceBlueprint, VolumeSpec, JenkinsBlueprint (+12 more)

### Community 2 - "Docker Engine Runtime & Deployment"
Cohesion: 0.09
Nodes (4): InstalledServiceInstance, DockerService, ServicesService, VaultService

### Community 3 - "Governance & Dual-Approval Controller"
Cohesion: 0.12
Nodes (4): GovernanceController, ApprovalTicket, GovernanceSettings, GovernanceService

### Community 4 - "Backend Infrastructure Dependencies"
Cohesion: 0.06
Nodes (35): author, dependencies, dockerode, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/platform-express, reflect-metadata (+27 more)

### Community 5 - "Frontend UI Dependencies"
Cohesion: 0.06
Nodes (34): dependencies, clsx, lucide-react, react, react-dom, tailwind-merge, devDependencies, autoprefixer (+26 more)

### Community 7 - "NestJS Control Plane Modules"
Cohesion: 0.16
Nodes (9): AppModule, AuditModule, CatalogModule, DockerModule, GovernanceModule, ServicesModule, VaultModule, @nestjs/common (+1 more)

### Community 8 - "Backend TypeScript Build Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, experimentalDecorators, forceConsistentCasingInFileNames, incremental (+10 more)

### Community 10 - "Backend Dev Tooling"
Cohesion: 0.17
Nodes (12): devDependencies, @nestjs/cli, @nestjs/schematics, source-map-support, ts-loader, ts-node, tsconfig-paths, @types/dockerode (+4 more)

### Community 11 - "Root Monorepo Manifest"
Cohesion: 0.18
Nodes (10): author, description, license, name, scripts, build, dev:backend, dev:frontend (+2 more)

### Community 12 - "Fintech Security Governance Concepts"
Cohesion: 0.28
Nodes (9): PortGrid Web Application Shell, Built-In Infrastructure Blueprints, NIST SP 800-88 Cryptographic Shredding, FIPS 140-2 AES-256 Envelope Encryption, Loopback Network Isolation, Maker-Checker Dual Control Governance, SHA-256 Merkle Audit Ledger, PortGrid Platform (+1 more)

### Community 13 - "Nest CLI Scaffolding Config"
Cohesion: 0.50
Nodes (3): collection, $schema, sourceRoot

## Knowledge Gaps
- **26 isolated node(s):** `@nestjs/platform-express`, `reflect-metadata`, `rxjs`, `@nestjs/cli`, `@nestjs/schematics` (+21 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 154 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@nestjs/common` connect `NestJS Control Plane Modules` to `Audit & Catalog Core Models`, `Backend Infrastructure Dependencies`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **What connects `@nestjs/platform-express`, `reflect-metadata`, `rxjs` to the rest of the system?**
  _26 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend React Dashboard & Modals` be split into smaller, more focused modules?**
  _Cohesion score 0.07648401826484018 - nodes in this community are weakly interconnected._
- **Why does `DockerService` connect `Docker Engine Runtime & Deployment` to `Audit & Catalog Core Models`, `Catalog & Metrics Orchestration`, `NestJS Control Plane Modules`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Should `Audit & Catalog Core Models` be split into smaller, more focused modules?**
  _Cohesion score 0.08571428571428572 - nodes in this community are weakly interconnected._
- **Why does `ServicesService` connect `Docker Engine Runtime & Deployment` to `Audit & Catalog Core Models`, `Governance & Dual-Approval Controller`, `Catalog & Metrics Orchestration`, `NestJS Control Plane Modules`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Should `Docker Engine Runtime & Deployment` be split into smaller, more focused modules?**
  _Cohesion score 0.09358974358974359 - nodes in this community are weakly interconnected._