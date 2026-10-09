import { ServiceBlueprint } from '../blueprint.interface';

export const PostgresBlueprint: ServiceBlueprint = {
  id: 'postgresql',
  name: 'PostgreSQL 16 & pgAdmin 4',
  category: 'Database',
  description: 'Production-ready PostgreSQL database with paired pgAdmin 4 web administration UI.',
  icon: 'Database',
  engine: {
    namePrefix: 'portgrid-pg',
    image: 'postgres:16-alpine',
    defaultPort: 5432,
    internalPort: 5432,
    env: {
      POSTGRES_USER: 'postgres',
      POSTGRES_DB: 'devdb',
      POSTGRES_PASSWORD: '{{GENERATED_PASSWORD}}',
    },
    volumes: [
      {
        name: 'portgrid_pg_data',
        mountPath: '/var/lib/postgresql/data',
      },
    ],
  },
  companionUi: {
    name: 'pgAdmin 4',
    namePrefix: 'portgrid-pgadmin',
    image: 'dpage/pgadmin4:latest',
    defaultPort: 5050,
    internalPort: 5050,
    env: {
      PGADMIN_DEFAULT_EMAIL: 'admin@portgrid.com',
      PGADMIN_DEFAULT_PASSWORD: '{{GENERATED_PASSWORD}}',
      PGADMIN_LISTEN_PORT: '5050',
      PGADMIN_CONFIG_SERVER_MODE: 'False',
      PGADMIN_CONFIG_MASTER_PASSWORD_REQUIRED: 'False',
    },
    note: 'Auto-configured web UI for PostgreSQL. Login: admin@portgrid.com with generated password. Host: {{ENGINE_HOST}}',
  },
  connectionFormatters: {
    uri: 'postgresql://postgres:{{GENERATED_PASSWORD}}@localhost:{{ENGINE_PORT}}/devdb',
    jdbc: 'jdbc:postgresql://localhost:{{ENGINE_PORT}}/devdb?user=postgres&password={{GENERATED_PASSWORD}}',
    envSnippet: `DB_HOST=localhost
DB_PORT={{ENGINE_PORT}}
DB_USER=postgres
DB_PASSWORD={{GENERATED_PASSWORD}}
DB_NAME=devdb
DATABASE_URL=postgresql://postgres:{{GENERATED_PASSWORD}}@localhost:{{ENGINE_PORT}}/devdb`,
    notes: 'Direct connection available on localhost:{{ENGINE_PORT}}',
  },
};
