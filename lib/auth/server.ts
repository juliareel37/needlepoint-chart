import { auth as clerkAuth } from "@clerk/nextjs/server";

export interface AuthSession {
  userId: string | null;
}

export async function getAuthSession(): Promise<AuthSession> {
  const { userId } = await clerkAuth();
  return { userId };
}

export async function getCurrentUserId(): Promise<string | null> {
  return (await getAuthSession()).userId;
}
