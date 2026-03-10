#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DataStack } from '../lib/data-stack';
import { AuthStack } from '../lib/auth-stack';
import { ApiStack } from '../lib/api-stack';
import { HostingStack } from '../lib/hosting-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

const dataStack = new DataStack(app, 'JobTrailDataStack', { env });

const authStack = new AuthStack(app, 'JobTrailAuthStack', { env });

const apiStack = new ApiStack(app, 'JobTrailApiStack', {
  env,
  table: dataStack.table,
  userPool: authStack.userPool,
  userPoolClient: authStack.userPoolClient,
});

const hostingStack = new HostingStack(app, 'JobTrailHostingStack', { env });
