import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as apigatewayAuthorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as path from 'path';
import { Construct } from 'constructs';

interface ApiStackProps extends cdk.StackProps {
  table: dynamodb.Table;
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
}

export class ApiStack extends cdk.Stack {
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { table, userPool, userPoolClient } = props;

    const commonEnv = {
      TABLE_NAME: table.tableName,
      COGNITO_USER_POOL_ID: userPool.userPoolId,
      NODE_OPTIONS: '--enable-source-maps',
    };

    const commonLambdaProps = {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    };

    const distPath = path.join(__dirname, '../../backend/dist');

    // Lambda functions - code from backend/dist
    const applicationsFunction = new lambda.Function(this, 'ApplicationsFunction', {
      ...commonLambdaProps,
      functionName: 'job-trail-applications',
      code: lambda.Code.fromAsset(distPath),
      handler: 'functions/applications.handler',
    });

    const interviewsFunction = new lambda.Function(this, 'InterviewsFunction', {
      ...commonLambdaProps,
      functionName: 'job-trail-interviews',
      code: lambda.Code.fromAsset(distPath),
      handler: 'functions/interviews.handler',
    });

    const profileFunction = new lambda.Function(this, 'ProfileFunction', {
      ...commonLambdaProps,
      functionName: 'job-trail-profile',
      code: lambda.Code.fromAsset(distPath),
      handler: 'functions/profile.handler',
    });

    const publicFunction = new lambda.Function(this, 'PublicFunction', {
      ...commonLambdaProps,
      functionName: 'job-trail-public',
      code: lambda.Code.fromAsset(distPath),
      handler: 'functions/public.handler',
    });

    // Grant DynamoDB access
    table.grantReadWriteData(applicationsFunction);
    table.grantReadWriteData(interviewsFunction);
    table.grantReadWriteData(profileFunction);
    table.grantReadData(publicFunction);
    userPool.grant(profileFunction, 'cognito-idp:AdminDeleteUser');

    // HTTP API
    const httpApi = new apigateway.HttpApi(this, 'JobTrailApi', {
      apiName: 'job-trail-api',
      createDefaultStage: false,
      corsPreflight: {
        allowHeaders: ['Content-Type', 'Authorization'],
        allowMethods: [
          apigateway.CorsHttpMethod.GET,
          apigateway.CorsHttpMethod.POST,
          apigateway.CorsHttpMethod.PUT,
          apigateway.CorsHttpMethod.DELETE,
          apigateway.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: ['https://jobtrail.dev'],
      },
    });
    const defaultStage = httpApi.addStage('DefaultStage', {
      stageName: '$default',
      autoDeploy: true,
      throttle: {
        burstLimit: 50,
        rateLimit: 20,
      },
    });

    // JWT Authorizer
    const authorizer = new apigatewayAuthorizers.HttpJwtAuthorizer(
      'CognitoAuthorizer',
      `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
      {
        jwtAudience: [userPoolClient.userPoolClientId],
      }
    );

    const authRouteOptions = { authorizer };

    // Application routes
    const applicationsIntegration = new apigatewayIntegrations.HttpLambdaIntegration(
      'ApplicationsIntegration', applicationsFunction
    );
    httpApi.addRoutes({ path: '/applications', methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.POST], integration: applicationsIntegration, ...authRouteOptions });
    httpApi.addRoutes({ path: '/applications/{id}', methods: [apigateway.HttpMethod.PUT, apigateway.HttpMethod.DELETE], integration: applicationsIntegration, ...authRouteOptions });

    // Interview routes
    const interviewsIntegration = new apigatewayIntegrations.HttpLambdaIntegration(
      'InterviewsIntegration', interviewsFunction
    );
    httpApi.addRoutes({ path: '/interviews', methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.POST], integration: interviewsIntegration, ...authRouteOptions });
    httpApi.addRoutes({ path: '/interviews/{id}', methods: [apigateway.HttpMethod.PUT, apigateway.HttpMethod.DELETE], integration: interviewsIntegration, ...authRouteOptions });

    // Profile routes
    const profileIntegration = new apigatewayIntegrations.HttpLambdaIntegration(
      'ProfileIntegration', profileFunction
    );
    httpApi.addRoutes({ path: '/profile', methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.PUT, apigateway.HttpMethod.DELETE], integration: profileIntegration, ...authRouteOptions });

    // Public route (no auth)
    const publicIntegration = new apigatewayIntegrations.HttpLambdaIntegration(
      'PublicIntegration', publicFunction
    );
    httpApi.addRoutes({ path: '/public/{shareToken}', methods: [apigateway.HttpMethod.GET], integration: publicIntegration });

    const alertsTopic = new sns.Topic(this, 'OperationalAlertsTopic', {
      topicName: 'job-trail-operational-alerts',
      displayName: 'Job Trail Operational Alerts',
    });

    const createLambdaErrorRateAlarm = (id: string, fn: lambda.Function) => {
      const errorRateMetric = new cloudwatch.MathExpression({
        expression: 'IF(invocations > 0, (errors / invocations) * 100, 0)',
        usingMetrics: {
          errors: fn.metricErrors({
            period: cdk.Duration.minutes(1),
            statistic: 'sum',
          }),
          invocations: fn.metricInvocations({
            period: cdk.Duration.minutes(1),
            statistic: 'sum',
          }),
        },
        period: cdk.Duration.minutes(1),
      });

      const alarm = new cloudwatch.Alarm(this, `${id}ErrorRateAlarm`, {
        metric: errorRateMetric,
        threshold: 1,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `${fn.functionName} Lambda error rate exceeded 1% in the last minute`,
      });
      alarm.addAlarmAction(new cloudwatchActions.SnsAction(alertsTopic));
    };

    createLambdaErrorRateAlarm('ApplicationsLambda', applicationsFunction);
    createLambdaErrorRateAlarm('InterviewsLambda', interviewsFunction);
    createLambdaErrorRateAlarm('ProfileLambda', profileFunction);
    createLambdaErrorRateAlarm('PublicLambda', publicFunction);

    const api5xxAlarm = new cloudwatch.Alarm(this, 'HttpApi5xxAlarm', {
      metric: defaultStage.metricServerError({
        period: cdk.Duration.minutes(1),
        statistic: 'sum',
      }),
      threshold: 5,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'HTTP API 5xx count exceeded 5 in the last minute',
    });
    api5xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertsTopic));

    const ddbThrottleAlarm = new cloudwatch.Alarm(this, 'DynamoDbThrottleAlarm', {
      metric: table.metricThrottledRequests({
        period: cdk.Duration.minutes(1),
        statistic: 'sum',
      }),
      threshold: 0,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'DynamoDB reported throttled requests in the last minute',
    });
    ddbThrottleAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertsTopic));

    this.apiUrl = httpApi.apiEndpoint;

    new cdk.CfnOutput(this, 'ApiUrl', { value: this.apiUrl });
    new cdk.CfnOutput(this, 'AlertsTopicArn', { value: alertsTopic.topicArn });
  }
}
