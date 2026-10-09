import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { ServiceBlueprint } from '../catalog/blueprint.interface';

@Injectable()
export class VaultService {
  private readonly logger = new Logger(VaultService.name);
  private masterKey: Buffer;

  constructor() {
    this.masterKey = this.initMasterKey();
  }

  /**
   * Initializes or derives the 256-bit Master Key for envelope encryption
   */
  private initMasterKey(): Buffer {
    const envKey = process.env.PORTGRID_MASTER_KEY;
    if (envKey && envKey.trim().length > 0) {
      return crypto.createHash('sha256').update(envKey.trim()).digest();
    }

    const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const keyPath = path.join(dataDir, '.master.key');
    if (fs.existsSync(keyPath)) {
      try {
        const rawHex = fs.readFileSync(keyPath, 'utf-8').trim();
        return Buffer.from(rawHex, 'hex');
      } catch (err: any) {
        this.logger.warn(`Could not read master key file, generating new one: ${err.message}`);
      }
    }

    // Generate high-entropy 256-bit cryptographic master key
    const newKey = crypto.randomBytes(32);
    try {
      fs.writeFileSync(keyPath, newKey.toString('hex'), { mode: 0o600 });
      this.logger.log('Initialized new FIPS-grade 256-bit Master Encryption Key in data/.master.key');
    } catch (err: any) {
      this.logger.error(`Failed to persist master key: ${err.message}`);
    }
    return newKey;
  }

  /**
   * Encrypts plaintext using authenticated AES-256-GCM with a fresh 12-byte IV
   */
  encrypt(plaintext: string): string {
    if (!plaintext) return plaintext;
    const iv = crypto.randomBytes(12); // 96-bit recommended IV for AES-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return `enc:v1:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypts AES-256-GCM ciphertext and validates authentication tag
   */
  decrypt(ciphertextEnvelope: string): string {
    if (!ciphertextEnvelope || !ciphertextEnvelope.startsWith('enc:v1:')) {
      return ciphertextEnvelope; // Return unchanged if plaintext (backward compatibility)
    }

    try {
      const parts = ciphertextEnvelope.split(':');
      if (parts.length !== 5) {
        throw new Error('Malformed envelope format');
      }

      const iv = Buffer.from(parts[2], 'hex');
      const authTag = Buffer.from(parts[3], 'hex');
      const ciphertext = parts[4];

      const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err: any) {
      this.logger.error(`Decryption failed or data tampered: ${err.message}`);
      return '[DECRYPTION_ERROR: AUTHENTICATION_FAILED]';
    }
  }

  /**
   * Checks if a string is encrypted with PortGrid envelope encryption
   */
  isEncrypted(value: string): boolean {
    return typeof value === 'string' && value.startsWith('enc:v1:');
  }

  /**
   * Generates a strong random alphanumeric password safe for environment variables and connection URIs
   */
  generatePassword(length: number = 20): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      result += charset[bytes[i] % charset.length];
    }
    return result;
  }

  /**
   * Substitutes template placeholders in environment variables and commands
   */
  interpolate(
    text: string,
    variables: Record<string, string | number>,
  ): string {
    if (!text) return text;
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    }
    return result;
  }

  /**
   * Builds formatted connection strings from blueprint specifications
   */
  buildConnectionStrings(
    blueprint: ServiceBlueprint,
    variables: {
      GENERATED_PASSWORD: string;
      ENGINE_PORT: number;
      UI_PORT?: number;
      ENGINE_HOST?: string;
      UI_HOST?: string;
    },
  ) {
    const { GENERATED_PASSWORD, ENGINE_PORT, UI_PORT, ENGINE_HOST, UI_HOST } = variables;
    const formatters = blueprint.connectionFormatters;

    const uri = formatters.uri
      ? this.interpolate(formatters.uri, {
          GENERATED_PASSWORD,
          ENGINE_PORT,
          UI_PORT: UI_PORT || ENGINE_PORT,
          ENGINE_HOST: ENGINE_HOST || 'localhost',
          UI_HOST: UI_HOST || 'localhost',
        })
      : undefined;

    const jdbc = formatters.jdbc
      ? this.interpolate(formatters.jdbc, {
          GENERATED_PASSWORD,
          ENGINE_PORT,
          UI_PORT: UI_PORT || ENGINE_PORT,
          ENGINE_HOST: ENGINE_HOST || 'localhost',
          UI_HOST: UI_HOST || 'localhost',
        })
      : undefined;

    const envSnippet = this.interpolate(formatters.envSnippet, {
      GENERATED_PASSWORD,
      ENGINE_PORT,
      UI_PORT: UI_PORT || ENGINE_PORT,
      ENGINE_HOST: ENGINE_HOST || 'localhost',
      UI_HOST: UI_HOST || 'localhost',
    });

    return { uri, jdbc, envSnippet };
  }
}
