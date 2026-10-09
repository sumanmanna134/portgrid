import { ServiceBlueprint } from '../blueprint.interface';

export const RedisBlueprint: ServiceBlueprint = {
  id: 'redis',
  name: 'Redis 7 & Redis Commander',
  category: 'Cache',
  description: 'In-memory data structure store & cache with web-based Redis Commander management UI.',
  icon: 'Zap',
  engine: {
    namePrefix: 'portgrid-redis',
    image: 'redis:7-alpine',
    defaultPort: 6379,
    internalPort: 6379,
    env: {
      REDIS_PASSWORD: '{{GENERATED_PASSWORD}}',
    },
    cmd: ['redis-server', '--requirepass', '{{GENERATED_PASSWORD}}'],
    volumes: [
      {
        name: 'portgrid_redis_data',
        mountPath: '/data',
      },
    ],
  },
  companionUi: {
    name: 'Redis Commander',
    namePrefix: 'portgrid-redis-ui',
    image: 'rediscommander/redis-commander:latest',
    defaultPort: 8081,
    internalPort: 8081,
    env: {
      REDIS_HOSTS: 'local:{{ENGINE_HOST}}:6379:0:{{GENERATED_PASSWORD}}',
      REDIS_HOST: '{{ENGINE_HOST}}',
      REDIS_PORT: '6379',
      REDIS_PASSWORD: '{{GENERATED_PASSWORD}}',
      // HTTP auth omitted for frictionless local dev access to web console
    },
    note: 'Visual key-value explorer. Direct zero-login access to localhost Redis engine.',
  },
  connectionFormatters: {
    uri: 'redis://:{{GENERATED_PASSWORD}}@localhost:{{ENGINE_PORT}}',
    envSnippet: `REDIS_HOST=localhost
REDIS_PORT={{ENGINE_PORT}}
REDIS_PASSWORD={{GENERATED_PASSWORD}}
REDIS_URL=redis://:{{GENERATED_PASSWORD}}@localhost:{{ENGINE_PORT}}`,
    notes: 'Connect with redis-cli -h localhost -p {{ENGINE_PORT}} -a {{GENERATED_PASSWORD}}',
  },
};
