import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { getItem, putItem, deleteItem, queryItems, TABLE_NAME } from '../shared/db';
import { getUserId, ok, created, noContent, notFound, badRequest, serverError, parseBody } from '../shared/middleware';
import { logLambdaError } from '../shared/logging';

// Application type
interface Application {
  id: string;
  userId: string;
  company: string;
  title: string;
  status: string;
  method: string;
  dateApplied: string;
  lastUpdated: string;
  link?: string;
  notes?: string;
}

function toApplication(item: Record<string, unknown>): Application {
  // Strip DynamoDB PK/SK keys
  const { PK, SK, ...rest } = item;
  return rest as unknown as Application;
}

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> => {
  let userId: string | undefined;
  try {
    userId = getUserId(event);
    const method = event.requestContext.http.method;
    const id = event.pathParameters?.id;

    if (method === 'GET' && !id) {
      const items = await queryItems(`USER#${userId}`, 'APP#');
      return ok(items.map(toApplication));
    }

    if (method === 'POST') {
      const body = parseBody<Omit<Application, 'id' | 'userId' | 'lastUpdated'>>(event);
      if (!body.company || !body.title || !body.status || !body.method || !body.dateApplied) {
        return badRequest('Missing required fields');
      }
      const appId = uuidv4();
      const now = new Date().toISOString().split('T')[0];
      const app: Application & { PK: string; SK: string } = {
        PK: `USER#${userId}`,
        SK: `APP#${appId}`,
        id: appId,
        userId,
        company: body.company,
        title: body.title,
        status: body.status,
        method: body.method,
        dateApplied: body.dateApplied,
        lastUpdated: now,
        ...(body.link && { link: body.link }),
      };
      await putItem(app as unknown as Record<string, unknown>);
      return created(toApplication(app as unknown as Record<string, unknown>));
    }

    if (method === 'PUT' && id) {
      const existing = await getItem(`USER#${userId}`, `APP#${id}`);
      if (!existing || existing.userId !== userId) return notFound();
      const body = parseBody<Partial<Application>>(event);
      const now = new Date().toISOString().split('T')[0];
      const updated = { ...existing, ...body, lastUpdated: now, userId, id, PK: `USER#${userId}`, SK: `APP#${id}` };
      await putItem(updated);
      return ok(toApplication(updated));
    }

    if (method === 'DELETE' && id) {
      const existing = await getItem(`USER#${userId}`, `APP#${id}`);
      if (!existing || existing.userId !== userId) return notFound();
      await deleteItem(`USER#${userId}`, `APP#${id}`);
      return noContent();
    }

    return badRequest('Method not supported');
  } catch (e) {
    logLambdaError({
      operation: 'applications.handler',
      requestId: event.requestContext.requestId,
      userId,
      error: e,
    });
    return serverError();
  }
};
