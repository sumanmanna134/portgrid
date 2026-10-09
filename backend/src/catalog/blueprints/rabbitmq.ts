import { ServiceBlueprint } from '../blueprint.interface';

export const RabbitMQBlueprint: ServiceBlueprint = {
  id: 'rabbitmq',
  name: 'RabbitMQ & Management UI',
  category: 'Message Broker',
  description: 'Robust AMQP message broker with built-in real-time Web Management dashboard.',
  icon: 'Layers',
  engine: {
    namePrefix: 'portgrid-rabbitmq',
    image: 'rabbitmq:3.13-management-alpine',
    defaultPort: 5672,
    internalPort: 5672,
    additionalPorts: [
      { defaultHostPort: 15672, containerPort: 15672, isUi: true },
    ],
    env: {
      RABBITMQ_DEFAULT_USER: 'guest',
      RABBITMQ_DEFAULT_PASS: '{{GENERATED_PASSWORD}}',
    },
    volumes: [
      {
        name: 'portgrid_rabbitmq_data',
        mountPath: '/var/lib/rabbitmq',
      },
    ],
  },
  companionUi: {
    name: 'RabbitMQ Management Console',
    namePrefix: 'portgrid-rabbitmq-mgmt',
    image: '', // Native UI embedded on port 15672
    defaultPort: 15672,
    internalPort: 15672,
    env: {},
    note: 'RabbitMQ Management UI is exposed on port 15672. Sign in with user "guest" and your generated password.',
  },
  connectionFormatters: {
    uri: 'amqp://guest:{{GENERATED_PASSWORD}}@localhost:{{ENGINE_PORT}}',
    envSnippet: `RABBITMQ_HOST=localhost
RABBITMQ_PORT={{ENGINE_PORT}}
RABBITMQ_USER=guest
RABBITMQ_PASSWORD={{GENERATED_PASSWORD}}
RABBITMQ_URL=amqp://guest:{{GENERATED_PASSWORD}}@localhost:{{ENGINE_PORT}}`,
    notes: 'Management Dashboard available on http://localhost:{{UI_PORT}}',
  },
};
