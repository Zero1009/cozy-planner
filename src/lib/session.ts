import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, schema } from "@/db/client";
import {
  getAuthSecret,
  SESSION_COOKIE,
  sessionMaxAgeSeconds,
  signSession,
  verifySession,
} from "@/lib/auth";

export interface CurrentUser {
  id: number;
  username: string;
  displayName: string;
  isAdmin: boolean;
  mustUpdateProfile: boolean;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const session = verifySession(store.get(SESSION_COOKIE)?.value, getAuthSecret());
  if (!session) return null;

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.userId))
    .limit(1);

  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    isAdmin: user.isAdmin,
    mustUpdateProfile: user.mustUpdateProfile,
  };
}

export async function setSessionCookie(user: CurrentUser): Promise<void> {
  const store = await cookies();
  store.set({
    name: SESSION_COOKIE,
    value: signSession(
      { userId: user.id, username: user.username, isAdmin: user.isAdmin },
      getAuthSecret()
    ),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAgeSeconds(),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
