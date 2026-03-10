import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { getItem, putItem, deleteItem, queryItems } from '../shared/db';
import { getUserId, ok, created, noContent, notFound, badRequest, serverError, parseBody } from '../shared/middleware';

interface Interview {
  id: string;
  userId: string;
  company: string;
  title?: string;
  type: string;
  date: string;      // YYYY-MM-DD
  time: string;      // "HH:MM AM/PM" | "TBD"
  tentative: boolean;
  notes?: string;
}

function toInterview(item: Record<string, unknown>): Interview {
  // Strip DynamoDB PK/SK keys
  const { PK, SK, ...rest } = item;
  return rest as Interview;
}

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> => {
  try {
    const userId = getUserId(event);
    const method = event.requestContext.http.method;
    const id = event.pathParameters?.id;

    if (method === 'GET' && !id) {
      const items = await queryItems(`USER#${userId}`, 'INT#');
      return ok(items.map(toInterview));
    }

    if (method === 'POST') {
      const body = parseBody<Omit<Interview, 'id' | 'userId'>>(event);
      if (!body.company || !body.type || !body.date || !body.time || body.tentative === undefined) {
        return badRequest('Missing required fields');
      }
      const intId = uuidv4();
      const interview: Interview & { PK: string; SK: string } = {
        PK: `USER#${userId}`,
        SK: `INT#${intId}`,
        id: intId,
        userId,
        company: body.company,
        type: body.type,
        date: body.date,
        time: body.time,
        tentative: body.tentative,
        ...(body.title && { title: body.title }),
        ...(body.notes && { notes: body.notes }),
      };
      await putItem(interview);
      return created(toInterview(interview));
    }

    if (method === 'PUT' && id) {
      const existing = await getItem(`USER#${userId}`, `INT#${id}`);
      if (!existing || existing.userId !== userId) return notFound();
      const body = parseBody<Partial<Interview>>(event);
      const updated = {
        ...existing,
        ...body,
        userId,
        id,
        PK: `USER#${userId}`,
        SK: `INT#${id}`,
      };
      await putItem(updated);
      return ok(toInterview(updated));
    }

    if (method === 'DELETE' && id) {
      const existing = await getItem(`USER#${userId}`, `INT#${id}`);
      if (!existing || existing.userId !== userId) return notFound();
      await deleteItem(`USER#${userId}`, `INT#${id}`);
      return noContent();
    }

    return badRequest('Method not supported');
  } catch (e) {
    console.error(e);
    return serverError();
  }
};
