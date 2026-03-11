import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { CognitoIdentityProviderClient, AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { deleteItem, getItem, putItem, queryPartitionItems } from '../shared/db';
import { badRequest, getCognitoUsername, getUserId, noContent, ok, parseBody, serverError } from '../shared/middleware';
import { logLambdaError } from '../shared/logging';

interface Profile {
  userId: string;
  displayName?: string;
  isPublic: boolean;
  shareToken: string;
}

async function getOrCreateProfile(userId: string): Promise<Profile & { PK: string; SK: string }> {
  const existing = await getItem(`USER#${userId}`, 'PROFILE');
  if (existing) return existing as Profile & { PK: string; SK: string };

  const shareToken = uuidv4();
  const profile = {
    PK: `USER#${userId}`,
    SK: 'PROFILE',
    userId,
    displayName: '',
    isPublic: false,
    shareToken,
  };
  await putItem(profile);
  return profile;
}

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> => {
  let userId: string | undefined;
  try {
    userId = getUserId(event);
    const method = event.requestContext.http.method;
    const userPoolId = process.env.COGNITO_USER_POOL_ID;

    if (method === 'GET') {
      const profile = await getOrCreateProfile(userId);
      const { PK, SK, ...rest } = profile;
      return ok(rest);
    }

    if (method === 'PUT') {
      const profile = await getOrCreateProfile(userId);
      const body = parseBody<{ displayName?: string; isPublic?: boolean }>(event);
      const wasPublic = profile.isPublic;
      const updated = { ...profile, ...body };
      await putItem(updated);

      // Maintain SHARE# index
      if (updated.isPublic && !wasPublic) {
        await putItem({
          PK: `SHARE#${profile.shareToken}`,
          SK: 'PROFILE',
          userId,
          shareToken: profile.shareToken,
        });
      }

      // If toggled from public to private, remove the SHARE# index entry
      if (!updated.isPublic && wasPublic) {
        const { deleteItem } = await import('../shared/db');
        await deleteItem(`SHARE#${profile.shareToken}`, 'PROFILE');
      }

      const { PK, SK, ...rest } = updated;
      return ok(rest);
    }

    if (method === 'DELETE') {
      if (!userPoolId) return serverError('Cognito user pool not configured');

      const cognitoUsername = getCognitoUsername(event);
      const profile = await getItem(`USER#${userId}`, 'PROFILE') as (Profile & { PK: string; SK: string }) | undefined;
      const userItems = await queryPartitionItems(`USER#${userId}`);

      const deletePromises = userItems
        .map(item => {
          const PK = item.PK;
          const SK = item.SK;
          if (typeof PK !== 'string' || typeof SK !== 'string') return null;
          return deleteItem(PK, SK);
        })
        .filter((value): value is Promise<void> => value !== null);

      await Promise.all(deletePromises);

      if (profile?.shareToken) {
        await deleteItem(`SHARE#${profile.shareToken}`, 'PROFILE');
      }

      const cognito = new CognitoIdentityProviderClient({});
      await cognito.send(new AdminDeleteUserCommand({
        UserPoolId: userPoolId,
        Username: cognitoUsername,
      }));

      return noContent();
    }

    return badRequest('Method not supported');
  } catch (e) {
    logLambdaError({
      operation: 'profile.handler',
      requestId: event.requestContext.requestId,
      userId,
      error: e,
    });
    return serverError();
  }
};
