#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AppmysteryStack } from '../lib/appmystery-stack';

const app = new cdk.App();
new AppmysteryStack(app, 'AppmysteryStack', {
  // Uncomment the following line if you need to specify account and region
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
