import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getItem, queryItems } from '../shared/db';
import { ok, notFound, serverError } from '../shared/middleware';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const shareToken = event.pathParameters?.shareToken;
    if (!shareToken) return notFound();

    const shareEntry = await getItem(`SHARE#${shareToken}`, 'PROFILE');
    if (!shareEntry) return notFound('Profile not found');

    const { userId } = shareEntry as { userId: string };
    const profileItem = await getItem(`USER#${userId}`, 'PROFILE');
    if (!profileItem || !profileItem.isPublic) return notFound('Profile is not public');

    const [appItems, intItems] = await Promise.all([
      queryItems(`USER#${userId}`, 'APP#'),
      queryItems(`USER#${userId}`, 'INT#'),
    ]);

    const strip = (item: Record<string, unknown>) => {
      const { PK, SK, ...rest } = item;
      return rest;
    };

    return ok({
      displayName: profileItem.displayName || '',
      applications: appItems.map(strip),
      interviews: intItems.map(strip),
    });
  } catch (e) {
    console.error(e);
    return serverError();
  }
};
