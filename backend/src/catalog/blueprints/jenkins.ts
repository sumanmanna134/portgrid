import { ServiceBlueprint } from '../blueprint.interface';

export const JenkinsBlueprint: ServiceBlueprint = {
  id: 'jenkins',
  name: 'Jenkins CI/CD Automation',
  category: 'DevOps',
  description: 'Open source automation server with native pipeline support and web dashboard.',
  icon: 'GitBranch',
  engine: {
    namePrefix: 'portgrid-jenkins',
    image: 'jenkins/jenkins:lts-jdk17',
    defaultPort: 8090,
    internalPort: 8090,
    env: {
      JAVA_OPTS: '-Djenkins.install.runSetupWizard=false',
      JENKINS_OPTS: '--httpPort=8090',
    },
    volumes: [
      {
        name: 'portgrid_jenkins_home',
        mountPath: '/var/jenkins_home',
      },
    ],
  },
  companionUi: {
    name: 'Jenkins Web UI',
    namePrefix: 'portgrid-jenkins-ui',
    image: '', // Native UI
    defaultPort: 8090,
    internalPort: 8090,
    env: {},
    note: 'Native Jenkins console available directly on the web interface port.',
  },
  connectionFormatters: {
    uri: 'http://localhost:{{ENGINE_PORT}}',
    envSnippet: `JENKINS_URL=http://localhost:{{ENGINE_PORT}}
JENKINS_USER=admin`,
    notes: 'Access Jenkins UI directly at http://localhost:{{ENGINE_PORT}}',
  },
};
