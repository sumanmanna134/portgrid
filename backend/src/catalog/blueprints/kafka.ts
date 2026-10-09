import { ServiceBlueprint } from '../blueprint.interface';

export const KafkaBlueprint: ServiceBlueprint = {
  id: 'kafka',
  name: 'Apache Kafka & Kafka UI',
  category: 'Message Broker',
  description: 'Single-node Apache Kafka (KRaft mode, no Zookeeper required) with Provectus Kafka UI.',
  icon: 'Layers',
  engine: {
    namePrefix: 'portgrid-kafka',
    image: 'apache/kafka:3.7.0',
    defaultPort: 9092,
    internalPort: 9092,
    env: {
      KAFKA_NODE_ID: '1',
      KAFKA_PROCESS_ROLES: 'broker,controller',
      KAFKA_LISTENERS: 'PLAINTEXT://0.0.0.0:9092,DOCKER://0.0.0.0:29092,CONTROLLER://0.0.0.0:9093',
      KAFKA_ADVERTISED_LISTENERS: 'PLAINTEXT://localhost:{{ENGINE_PORT}},DOCKER://{{ENGINE_HOST}}:29092',
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: 'CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT,DOCKER:PLAINTEXT',
      KAFKA_CONTROLLER_LISTENER_NAMES: 'CONTROLLER',
      KAFKA_INTER_BROKER_LISTENER_NAME: 'DOCKER',
      KAFKA_CONTROLLER_QUORUM_VOTERS: '1@{{ENGINE_HOST}}:9093',
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: '1',
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: '1',
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: '1',
      KAFKA_LOG_DIRS: '/var/lib/kafka/data',
    },
    volumes: [
      {
        name: 'portgrid_kafka_data',
        mountPath: '/var/lib/kafka/data',
      },
    ],
  },
  companionUi: {
    name: 'Kafka UI (Provectus)',
    namePrefix: 'portgrid-kafka-ui',
    image: 'provectuslabs/kafka-ui:latest',
    defaultPort: 8080,
    internalPort: 8080,
    env: {
      KAFKA_CLUSTERS_0_NAME: 'local-cluster',
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: '{{ENGINE_HOST}}:29092',
    },
    note: 'Topic browser, message consumer/producer, consumer groups monitor.',
  },
  connectionFormatters: {
    uri: 'localhost:{{ENGINE_PORT}}',
    envSnippet: `KAFKA_BOOTSTRAP_SERVERS=localhost:{{ENGINE_PORT}}
KAFKA_CLIENT_ID=dev-service`,
    notes: 'Connect directly using bootstrap server: localhost:{{ENGINE_PORT}}',
  },
};
