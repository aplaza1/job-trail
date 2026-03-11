import {
  badRequest,
  created,
  getCognitoUsername,
  getUserId,
  noContent,
  notFound,
  ok,
  parseBody,
  serverError,
} from './middleware';

describe('middleware helpers', () => {
  it('returns expected status codes', () => {
    const status = (result: unknown) => (result as { statusCode: number }).statusCode;
    expect(status(ok({ a: 1 }))).toBe(200);
    expect(status(created({ a: 1 }))).toBe(201);
    expect(status(noContent())).toBe(204);
    expect(status(notFound())).toBe(404);
    expect(status(badRequest('bad'))).toBe(400);
    expect(status(serverError())).toBe(500);
  });

  it('extracts user claims', () => {
    const event = {
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              sub: 'sub-123',
              'cognito:username': 'user-123',
            },
          },
        },
      },
    };

    expect(getUserId(event as never)).toBe('sub-123');
    expect(getCognitoUsername(event as never)).toBe('user-123');
  });

  it('parses request body', () => {
    const value = parseBody<{ hello: string }>({ body: '{"hello":"world"}' });
    expect(value.hello).toBe('world');
  });
});
