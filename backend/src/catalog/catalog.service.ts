import {
  Injectable,
  ForbiddenException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ServiceBlueprint } from './blueprint.interface';
import { PostgresBlueprint } from './blueprints/postgresql';
import { RedisBlueprint } from './blueprints/redis';
import { KafkaBlueprint } from './blueprints/kafka';
import { KeycloakBlueprint } from './blueprints/keycloak';
import { JenkinsBlueprint } from './blueprints/jenkins';
import { RabbitMQBlueprint } from './blueprints/rabbitmq';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);
  private readonly officialBlueprints: Map<string, ServiceBlueprint> = new Map();
  private readonly customBlueprints: Map<string, ServiceBlueprint> = new Map();
  private readonly storageFilePath = path.join(
    process.env.DATA_DIR || path.join(process.cwd(), 'data'),
    'custom-blueprints.json',
  );

  constructor() {
    this.registerOfficialBlueprint(PostgresBlueprint);
    this.registerOfficialBlueprint(RedisBlueprint);
    this.registerOfficialBlueprint(KafkaBlueprint);
    this.registerOfficialBlueprint(KeycloakBlueprint);
    this.registerOfficialBlueprint(JenkinsBlueprint);
    this.registerOfficialBlueprint(RabbitMQBlueprint);

    this.ensureStorage();
    this.loadCustomBlueprints();
  }

  private registerOfficialBlueprint(blueprint: ServiceBlueprint) {
    this.officialBlueprints.set(blueprint.id, {
      ...blueprint,
      isOfficial: true,
    });
  }

  private ensureStorage() {
    const dir = path.dirname(this.storageFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.storageFilePath)) {
      fs.writeFileSync(this.storageFilePath, JSON.stringify([]), 'utf-8');
    }
  }

  private loadCustomBlueprints() {
    try {
      const data = fs.readFileSync(this.storageFilePath, 'utf-8');
      const list: ServiceBlueprint[] = JSON.parse(data);
      for (const item of list) {
        this.customBlueprints.set(item.id, {
          ...item,
          isOfficial: false,
        });
      }
      this.logger.log(`Loaded ${this.customBlueprints.size} custom service blueprints.`);
    } catch (err: any) {
      this.logger.warn(`Could not load custom blueprints: ${err.message}`);
    }
  }

  private saveCustomBlueprints() {
    try {
      const list = Array.from(this.customBlueprints.values());
      fs.writeFileSync(this.storageFilePath, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err: any) {
      this.logger.error(`Failed to persist custom blueprints: ${err.message}`);
    }
  }

  getAllBlueprints(): ServiceBlueprint[] {
    return [
      ...Array.from(this.officialBlueprints.values()),
      ...Array.from(this.customBlueprints.values()),
    ];
  }

  getBlueprintById(id: string): ServiceBlueprint | undefined {
    return this.officialBlueprints.get(id) || this.customBlueprints.get(id);
  }

  /**
   * Onboard a new custom service blueprint
   */
  createCustomBlueprint(blueprint: ServiceBlueprint): ServiceBlueprint {
    if (!blueprint.id) {
      throw new ConflictException('Blueprint ID is required');
    }

    // Clean and validate ID
    const cleanId = blueprint.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');

    if (this.officialBlueprints.has(cleanId)) {
      throw new ForbiddenException(`'${cleanId}' is a protected official system service and cannot be overwritten.`);
    }

    if (this.customBlueprints.has(cleanId)) {
      throw new ConflictException(`Service blueprint with ID '${cleanId}' already exists.`);
    }

    const newBlueprint: ServiceBlueprint = {
      ...blueprint,
      id: cleanId,
      isOfficial: false,
    };

    this.customBlueprints.set(cleanId, newBlueprint);
    this.saveCustomBlueprints();
    this.logger.log(`Successfully onboarded custom service blueprint: ${cleanId}`);
    return newBlueprint;
  }

  /**
   * Update an existing custom service blueprint
   */
  updateCustomBlueprint(id: string, blueprint: Partial<ServiceBlueprint>): ServiceBlueprint {
    if (this.officialBlueprints.has(id)) {
      throw new ForbiddenException('Official system services cannot be modified.');
    }

    const existing = this.customBlueprints.get(id);
    if (!existing) {
      throw new NotFoundException(`Custom blueprint '${id}' not found.`);
    }

    const updated: ServiceBlueprint = {
      ...existing,
      ...blueprint,
      id, // Preserve ID
      isOfficial: false, // Must remain custom
    };

    this.customBlueprints.set(id, updated);
    this.saveCustomBlueprints();
    this.logger.log(`Updated custom service blueprint: ${id}`);
    return updated;
  }

  /**
   * Delete a custom service blueprint
   */
  deleteCustomBlueprint(id: string): void {
    if (this.officialBlueprints.has(id)) {
      throw new ForbiddenException('Official system services cannot be deleted.');
    }

    if (!this.customBlueprints.has(id)) {
      throw new NotFoundException(`Custom blueprint '${id}' not found.`);
    }

    this.customBlueprints.delete(id);
    this.saveCustomBlueprints();
    this.logger.log(`Deleted custom service blueprint: ${id}`);
  }
}
