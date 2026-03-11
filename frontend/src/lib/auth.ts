// When VITE_DEV_MODE=true, skip Cognito and return fake user data.
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

// Configure Amplify only in production mode
if (!DEV_MODE) {
  const { Amplify } = await import('aws-amplify');
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID as string,
        userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID as string,
      },
    },
  });
}

export async function getIdToken(): Promise<string | null> {
  if (DEV_MODE) return 'dev-token';
  const { fetchAuthSession } = await import('aws-amplify/auth');
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<{ username: string; userId: string }> {
  if (DEV_MODE) return { username: 'dev@local.test', userId: 'local-dev-user' };
  const { getCurrentUser: _get } = await import('aws-amplify/auth');
  return _get();
}

export async function signIn(input: { username: string; password: string }) {
  if (DEV_MODE) return { isSignedIn: true, nextStep: { signInStep: 'DONE' as const } };
  const { signIn: _fn } = await import('aws-amplify/auth');
  return _fn(input);
}

export async function signOut() {
  if (DEV_MODE) return;
  const { signOut: _fn } = await import('aws-amplify/auth');
  return _fn();
}

export async function signUp(input: { username: string; password: string; options?: Record<string, unknown> }) {
  if (DEV_MODE) {
    return {
      isSignUpComplete: false,
      nextStep: { signUpStep: 'CONFIRM_SIGN_UP' as const, codeDeliveryDetails: { destination: input.username } },
    };
  }
  const { signUp: _fn } = await import('aws-amplify/auth');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return _fn(input as any);
}

export async function confirmSignUp(input: { username: string; confirmationCode: string }) {
  if (DEV_MODE) return { isSignUpComplete: true, nextStep: { signUpStep: 'DONE' as const } };
  const { confirmSignUp: _fn } = await import('aws-amplify/auth');
  return _fn(input);
}

export async function resetPassword(input: { username: string }) {
  if (DEV_MODE) {
    return {
      nextStep: {
        resetPasswordStep: 'CONFIRM_RESET_PASSWORD_WITH_CODE' as const,
        codeDeliveryDetails: { destination: input.username },
      },
    };
  }
  const { resetPassword: _fn } = await import('aws-amplify/auth');
  return _fn(input);
}

export async function confirmResetPassword(input: {
  username: string;
  confirmationCode: string;
  newPassword: string;
}) {
  if (DEV_MODE) return;
  const { confirmResetPassword: _fn } = await import('aws-amplify/auth');
  return _fn(input);
}
