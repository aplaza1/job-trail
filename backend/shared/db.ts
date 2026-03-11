import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = process.env.TABLE_NAME || 'job-trail';

const client = new DynamoDBClient({});
export const db = DynamoDBDocumentClient.from(client);

export { TABLE_NAME };

export async function getItem(PK: string, SK: string) {
  const result = await db.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK, SK },
  }));
  return result.Item;
}

export async function putItem(item: Record<string, unknown>) {
  await db.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
  }));
}

export async function deleteItem(PK: string, SK: string) {
  await db.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { PK, SK },
  }));
}

export async function queryItems(PK: string, SKPrefix: string) {
  const result = await db.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
    ExpressionAttributeValues: {
      ':pk': PK,
      ':skPrefix': SKPrefix,
    },
  }));
  return result.Items || [];
}

export async function queryPartitionItems(PK: string) {
  const items: Record<string, unknown>[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const result = await db.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': PK,
      },
      ExclusiveStartKey,
    }));

    if (result.Items) items.push(...(result.Items as Record<string, unknown>[]));
    ExclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);

  return items;
}
