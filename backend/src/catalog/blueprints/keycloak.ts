import { ServiceBlueprint } from '../blueprint.interface';

export const KeycloakBlueprint: ServiceBlueprint = {
  id: 'keycloak',
  name: 'Keycloak 24 (IAM & OAuth2 / OIDC)',
  category: 'Identity',
  description: 'Enterprise Identity and Access Management with OAuth2, OIDC, and SAML support.',
  icon: 'Key',
  engine: {
    namePrefix: 'portgrid-keycloak',
    image: 'quay.io/keycloak/keycloak:24.0.2',
    defaultPort: 8085,
    internalPort: 8085,
    env: {
      KEYCLOAK_ADMIN: 'admin',
      KEYCLOAK_ADMIN_PASSWORD: '{{GENERATED_PASSWORD}}',
      KC_HEALTH_ENABLED: 'true',
      KC_METRICS_ENABLED: 'true',
    },
    cmd: ['start-dev', '--http-port=8085'],
    volumes: [
      {
        name: 'portgrid_keycloak_data',
        mountPath: '/opt/keycloak/data',
      },
    ],
  },
  companionUi: {
    name: 'Keycloak Admin Console',
    namePrefix: 'portgrid-keycloak-console',
    image: '', // Native UI directly served on engine port!
    defaultPort: 8085,
    internalPort: 8085,
    env: {},
    note: 'Built-in Administration Console. Sign in with user "admin" and generated password.',
  },
  connectionFormatters: {
    uri: 'http://localhost:{{ENGINE_PORT}}',
    envSnippet: `KEYCLOAK_URL=http://localhost:{{ENGINE_PORT}}
KEYCLOAK_REALM=master
KEYCLOAK_CLIENT_ID=admin-cli
KEYCLOAK_ADMIN_USER=admin
KEYCLOAK_ADMIN_PASSWORD={{GENERATED_PASSWORD}}`,
    notes: 'Access the admin console at http://localhost:{{ENGINE_PORT}}/admin',
  },
};
