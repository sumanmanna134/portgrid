import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ServicesService, InstallServiceOptions } from './services.service';
import { CatalogService } from '../catalog/catalog.service';
import { ServiceBlueprint } from '../catalog/blueprint.interface';

@Controller('api')
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly catalogService: CatalogService,
  ) {}

  @Get('catalog')
  getCatalog() {
    return this.catalogService.getAllBlueprints();
  }

  @Post('catalog/custom')
  createCustomBlueprint(@Body() blueprint: ServiceBlueprint) {
    return this.catalogService.createCustomBlueprint(blueprint);
  }

  @Put('catalog/custom/:id')
  updateCustomBlueprint(
    @Param('id') id: string,
    @Body() blueprint: Partial<ServiceBlueprint>,
  ) {
    return this.catalogService.updateCustomBlueprint(id, blueprint);
  }

  @Delete('catalog/custom/:id')
  deleteCustomBlueprint(@Param('id') id: string) {
    this.catalogService.deleteCustomBlueprint(id);
    return { success: true, message: `Deleted custom blueprint '${id}'` };
  }

  @Get('services')
  getAllServices() {
    return this.servicesService.getAllInstances();
  }

  @Get('services/:id')
  getService(@Param('id') id: string) {
    return this.servicesService.getInstanceById(id);
  }

  @Post('services/install')
  installService(@Body() dto: InstallServiceOptions | { blueprintId: string }) {
    return this.servicesService.install(dto);
  }

  @Post('services/:id/start')
  startService(@Param('id') id: string) {
    return this.servicesService.start(id);
  }

  @Post('services/:id/stop')
  stopService(@Param('id') id: string) {
    return this.servicesService.stop(id);
  }

  @Delete('services/:id')
  uninstallService(
    @Param('id') id: string,
    @Query('removeVolumes') removeVolumes?: string,
    @Query('ticketId') ticketId?: string,
  ) {
    const shouldRemoveVolumes = removeVolumes !== 'false'; // default true
    return this.servicesService.uninstall(id, shouldRemoveVolumes, ticketId);
  }

  @Get('services/:id/metrics')
  getServiceMetrics(@Param('id') id: string) {
    return this.servicesService.getMetrics(id);
  }

  @Get('services/:id/logs')
  getServiceLogs(@Param('id') id: string) {
    return this.servicesService.getLogs(id);
  }
}
