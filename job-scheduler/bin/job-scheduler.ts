#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { JobSchedulerStack } from '../lib/job-scheduler-stack';

const app = new cdk.App();
new JobSchedulerStack(app, 'JobSchedulerStack', {
  
});