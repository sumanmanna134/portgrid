# Graph Report - infradock  (2026-10-10)

## Corpus Check
- 57 files · ~29,224 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 426 nodes · 837 edges · 17 communities (13 shown, 4 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 62 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d1238ba7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- services.service.ts
- ServicesService
- GovernanceService
- backend/package.json
- frontend/package.json
- ServiceBlueprint
- NestJS Control Plane Modules
- Backend TypeScript Build Config
- Security & Audit Controller Endpoints
- 3. Step-by-Step Technical Implementation
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

## Communities (17 total, 4 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.07
Nodes (56): App(), AuditLogEntry, AuditModal(), AuditModalProps, VerificationResult, CatalogCard(), CatalogCardProps, getIcon() (+48 more)

### Community 1 - "services.service.ts"
Cohesion: 0.10
Nodes (17): AuditLogEntry, VerificationResult, CompanionUiSpec, ContainerSpec, PortMapping, VolumeSpec, JenkinsBlueprint, KafkaBlueprint (+9 more)

### Community 2 - "ServicesService"
Cohesion: 0.09
Nodes (6): InstalledServiceInstance, DockerService, ServicesService, VaultService, Step 1: Strict Network Isolation & Deterministic Loopback Binding, Step 5: NIST SP 800-88 Rev 1 Cryptographic Erase (CE)

### Community 3 - "GovernanceService"
Cohesion: 0.11
Nodes (5): GovernanceController, ApprovalTicket, GovernanceSettings, TicketStatus, GovernanceService

### Community 4 - "backend/package.json"
Cohesion: 0.04
Nodes (47): author, dependencies, dockerode, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/platform-express, reflect-metadata (+39 more)

### Community 5 - "frontend/package.json"
Cohesion: 0.06
Nodes (33): dependencies, clsx, lucide-react, react, react-dom, tailwind-merge, devDependencies, autoprefixer (+25 more)

### Community 6 - "ServiceBlueprint"
Cohesion: 0.10
Nodes (3): ServiceBlueprint, CatalogService, ServicesController

### Community 7 - "NestJS Control Plane Modules"
Cohesion: 0.16
Nodes (9): AppModule, AuditModule, CatalogModule, DockerModule, GovernanceModule, ServicesModule, VaultModule, @nestjs/common (+1 more)

### Community 8 - "Backend TypeScript Build Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, experimentalDecorators, forceConsistentCasingInFileNames, incremental (+10 more)

### Community 10 - "3. Step-by-Step Technical Implementation"
Cohesion: 0.10
Nodes (19): 1.1 Unrestricted Lateral Exposure (0.0.0.0 Default Bindings), 1.2 The Rogue Operator and Accidental Destruction (Lack of Dual Authorization), 1.3 Plaintext Secret Sprawl and Heap Memory Forensics, 1.4 Residual Media Forensics and Incomplete Decommissioning, 1.5 Non-Auditability and Log Tampering (Flat File Repudiation), 1.6 Privilege Escalation and Container Escapes, 1.7 Management Perimeter Exploitation, 1. Problem Statement: Critical Vulnerabilities in Cloud & Infrastructure Platforms (+11 more)

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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 171 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@nestjs/common` connect `NestJS Control Plane Modules` to `services.service.ts`, `GovernanceService`, `backend/package.json`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **What connects `@nestjs/platform-express`, `reflect-metadata`, `rxjs` to the rest of the system?**
  _26 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0747871158830063 - nodes in this community are weakly interconnected._
- **Why does `DockerService` connect `ServicesService` to `services.service.ts`, `ServiceBlueprint`, `NestJS Control Plane Modules`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Should `services.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10420168067226891 - nodes in this community are weakly interconnected._
- **Why does `3. Step-by-Step Technical Implementation` connect `3. Step-by-Step Technical Implementation` to `ServicesService`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `ServicesService` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._