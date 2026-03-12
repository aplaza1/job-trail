import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { CognitoIdentityProviderClient, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { db, TABLE_NAME } from '../shared/db';
import { getUserId, ok, serverError } from '../shared/middleware';
import { logLambdaError } from '../shared/logging';

const cognitoClient = new CognitoIdentityProviderClient({});

const ADMIN_USER_ID = process.env.ADMIN_USER_ID || '';
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';

function forbidden(): APIGatewayProxyResultV2 {
  return {
    statusCode: 403,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Forbidden' }),
  };
}

async function listAllCognitoUsers() {
  const users: { UserCreateDate?: Date }[] = [];
  let paginationToken: string | undefined;

  do {
    const result = await cognitoClient.send(new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      PaginationToken: paginationToken,
      Limit: 60,
    }));
    if (result.Users) users.push(...result.Users);
    paginationToken = result.PaginationToken;
  } while (paginationToken);

  return users;
}

async function scanCountBySKPrefix(skPrefix: string): Promise<number> {
  let count = 0;
  let ExclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const result = await db.send(new ScanCommand({
      TableName: TABLE_NAME,
      Select: 'COUNT',
      FilterExpression: 'begins_with(SK, :prefix)',
      ExpressionAttributeValues: { ':prefix': skPrefix },
      ExclusiveStartKey,
    }));
    count += result.Count ?? 0;
    ExclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);

  return count;
}

async function scanApplicationsByStatus(): Promise<Record<string, number>> {
  const byStatus: Record<string, number> = {};
  let ExclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const result = await db.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'begins_with(SK, :prefix)',
      ExpressionAttributeValues: { ':prefix': 'APP#' },
      ProjectionExpression: '#s',
      ExpressionAttributeNames: { '#s': 'status' },
      ExclusiveStartKey,
    }));

    for (const item of result.Items ?? []) {
      const status = (item.status as string) ?? 'unknown';
      byStatus[status] = (byStatus[status] ?? 0) + 1;
    }

    ExclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);

  return byStatus;
}

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext.requestId;
  let userId: string | undefined;

  try {
    userId = getUserId(event);

    if (userId !== ADMIN_USER_ID) {
      return forbidden();
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [cognitoUsers, appTotal, intTotal, appsByStatus] = await Promise.all([
      listAllCognitoUsers(),
      scanCountBySKPrefix('APP#'),
      scanCountBySKPrefix('INT#'),
      scanApplicationsByStatus(),
    ]);

    const newThisWeek = cognitoUsers.filter(u =>
      u.UserCreateDate && new Date(u.UserCreateDate) >= weekAgo
    ).length;

    const newThisMonth = cognitoUsers.filter(u =>
      u.UserCreateDate && new Date(u.UserCreateDate) >= monthAgo
    ).length;

    return ok({
      users: {
        total: cognitoUsers.length,
        newThisWeek,
        newThisMonth,
      },
      applications: {
        total: appTotal,
        byStatus: appsByStatus,
      },
      interviews: {
        total: intTotal,
      },
    });
  } catch (e) {
    logLambdaError({ operation: 'admin-stats', requestId, userId, error: e });
    return serverError();
  }
};
