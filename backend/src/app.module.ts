import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CatalogModule } from './catalog/catalog.module';
import { VaultModule } from './vault/vault.module';
import { DockerModule } from './docker/docker.module';
import { ServicesModule } from './services/services.module';
import { AuditModule } from './audit/audit.module';
import { GovernanceModule } from './governance/governance.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CatalogModule,
    VaultModule,
    DockerModule,
    ServicesModule,
    AuditModule,
    GovernanceModule,
  ],
})
export class AppModule {}
