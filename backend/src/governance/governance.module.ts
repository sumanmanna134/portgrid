import { Module, forwardRef } from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { GovernanceController } from './governance.controller';
import { AuditModule } from '../audit/audit.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [
    AuditModule,
    forwardRef(() => ServicesModule),
  ],
  controllers: [GovernanceController],
  providers: [GovernanceService],
  exports: [GovernanceService],
})
export class GovernanceModule {}
