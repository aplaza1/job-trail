import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { getItem, putItem, TABLE_NAME } from '../shared/db';
import { getUserId, ok, parseBody, serverError } from '../shared/middleware';

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
  try {
    const userId = getUserId(event);
    const method = event.requestContext.http.method;

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

    return ok({});
  } catch (e) {
    console.error(e);
    return serverError();
  }
};
