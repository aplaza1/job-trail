import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as apigatewayAuthorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
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
      NODE_OPTIONS: '--enable-source-maps',
    };

    const commonLambdaProps = {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
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

    // HTTP API
    const httpApi = new apigateway.HttpApi(this, 'JobTrailApi', {
      apiName: 'job-trail-api',
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
    httpApi.addRoutes({ path: '/profile', methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.PUT], integration: profileIntegration, ...authRouteOptions });

    // Public route (no auth)
    const publicIntegration = new apigatewayIntegrations.HttpLambdaIntegration(
      'PublicIntegration', publicFunction
    );
    httpApi.addRoutes({ path: '/public/{shareToken}', methods: [apigateway.HttpMethod.GET], integration: publicIntegration });

    this.apiUrl = httpApi.apiEndpoint;

    new cdk.CfnOutput(this, 'ApiUrl', { value: this.apiUrl });
  }
}
