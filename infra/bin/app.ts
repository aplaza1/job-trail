#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DataStack } from '../lib/data-stack';
import { AuthStack } from '../lib/auth-stack';
import { ApiStack } from '../lib/api-stack';
import { HostingStack } from '../lib/hosting-stack';
import { CertificateStack } from '../lib/certificate-stack';
import { DnsStack } from '../lib/dns-stack';

const app = new cdk.App({ crossRegionReferences: true });

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-west-2',
};

const dataStack = new DataStack(app, 'JobTrailDataStack', { env });

const authStack = new AuthStack(app, 'JobTrailAuthStack', { env });

const apiStack = new ApiStack(app, 'JobTrailApiStack', {
  env,
  table: dataStack.table,
  userPool: authStack.userPool,
  userPoolClient: authStack.userPoolClient,
});

const certStack = new CertificateStack(app, 'JobTrailCertStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
  crossRegionReferences: true,
});

const hostingStack = new HostingStack(app, 'JobTrailHostingStack', {
  env,
  crossRegionReferences: true,
  certificate: certStack.certificate,
});

new DnsStack(app, 'JobTrailDnsStack', {
  env,
  distribution: hostingStack.distribution,
});
