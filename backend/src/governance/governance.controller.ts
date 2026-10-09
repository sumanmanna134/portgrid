import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { GovernanceSettings } from './governance.interface';
import { ServicesService } from '../services/services.service';

@Controller('api/governance')
export class GovernanceController {
  constructor(
    private readonly governanceService: GovernanceService,
    private readonly servicesService: ServicesService,
  ) {}

  @Get('settings')
  getSettings() {
    return this.governanceService.getSettings();
  }

  @Put('settings')
  updateSettings(@Body() partial: Partial<GovernanceSettings>) {
    return this.governanceService.updateSettings(partial);
  }

  @Get('tickets')
  getTickets(@Query('status') status?: string) {
    const all = this.governanceService.getAllTickets();
    if (status) {
      return all.filter((t) => t.status === status);
    }
    return all;
  }

  @Get('tickets/pending')
  getPendingTickets() {
    return this.governanceService.getPendingTickets();
  }

  @Get('tickets/:id')
  getTicket(@Param('id') id: string) {
    return this.governanceService.getTicketById(id);
  }

  @Post('tickets/:id/approve')
  async approveTicket(
    @Param('id') id: string,
    @Body() body: { checkerUserId?: string; comment?: string; autoExecute?: boolean },
  ) {
    const ticket = this.governanceService.approveTicket(
      id,
      body?.checkerUserId || 'security_lead',
      body?.comment,
    );

    // If autoExecute requested, perform the operation immediately
    if (body?.autoExecute !== false) {
      if (ticket.action === 'UNINSTALL_SERVICE') {
        await this.servicesService.executeApprovedUninstall(ticket.id);
      }
    }

    return ticket;
  }

  @Post('tickets/:id/reject')
  rejectTicket(
    @Param('id') id: string,
    @Body() body: { checkerUserId?: string; comment?: string },
  ) {
    return this.governanceService.rejectTicket(
      id,
      body?.checkerUserId || 'security_lead',
      body?.comment,
    );
  }

  @Post('tickets/:id/execute')
  async executeTicket(@Param('id') id: string) {
    const ticket = this.governanceService.getTicketById(id);
    if (ticket.action === 'UNINSTALL_SERVICE') {
      await this.servicesService.executeApprovedUninstall(ticket.id);
    }
    return this.governanceService.getTicketById(id);
  }
}
