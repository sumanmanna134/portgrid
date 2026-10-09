import { Module, forwardRef } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { CatalogModule } from '../catalog/catalog.module';
import { VaultModule } from '../vault/vault.module';
import { DockerModule } from '../docker/docker.module';
import { AuditModule } from '../audit/audit.module';
import { GovernanceModule } from '../governance/governance.module';

@Module({
  imports: [
    CatalogModule,
    VaultModule,
    DockerModule,
    AuditModule,
    forwardRef(() => GovernanceModule),
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
