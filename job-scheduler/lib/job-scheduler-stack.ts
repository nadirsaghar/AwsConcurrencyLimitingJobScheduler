import { aws_lambda, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_stepfunctions_tasks as tasks } from 'aws-cdk-lib';
import { aws_stepfunctions as sfn } from 'aws-cdk-lib';
import * as path from 'path';
import { Condition } from 'aws-cdk-lib/aws-stepfunctions';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
export class JobSchedulerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const fn = new NodejsFunction(this, 'JobLauncherFunction', {
      bundling: {
        minify : false,
        target: 'es2020',
        tsconfig: path.join(__dirname, '../lambda/tsconfig.json')
      },
      handler: 'lambdaHandler',
      entry: path.join(__dirname, '../lambda/src/index.ts'),
      runtime: Runtime.NODEJS_14_X,

    });

    

    const jobLauncherTask = new tasks.LambdaInvoke(this, 'Launch Jobs', {
      lambdaFunction: fn,
      outputPath: '$.Payload',
      resultPath: '$',
    });

    const waitForOneMin = new sfn.Wait(this, 'Wait 1 Min', {
      time: sfn.WaitTime.duration(Duration.seconds(10))
    });
    waitForOneMin.next(jobLauncherTask)

    const completed = new sfn.Pass(this, 'Completed')
    const conditionTask = new sfn.Choice(this, 'Check if all jobs have finished?');
    conditionTask.when(Condition.booleanEquals('$.completed', true), completed)
    conditionTask.when(Condition.booleanEquals('$.completed', false), waitForOneMin)

    const definition = jobLauncherTask.next(conditionTask)
    const stepFn = new sfn.StateMachine(this,'JobSchedulerStateMachine',{
      definition 
    })

// add permissions
    fn.grantInvoke(stepFn)
    fn.addToRolePolicy( new PolicyStatement({
      sid: 'AllowFlowJobPermissions',
      actions: ['appflow:StartFlow' , 'appflow:DescribeFlowExecutionRecords' ] ,
      effect: Effect.ALLOW,
      resources: ['*'] // Be more specific. Adopt the principle of least privelege and grant permission to only those resources that need to be accessed
    }))

  }
}
