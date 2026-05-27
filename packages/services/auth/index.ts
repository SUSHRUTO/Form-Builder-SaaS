import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { db, eq, and, gt, isNull } from "@repo/database";
import {
  emailEventsTable,
  passwordResetTokensTable,
  sessionsTable,
  usersTable,
} from "@repo/database/schema";
import type { AuthUser } from "@repo/forms";
import { env } from "../env";

const scrypt = promisify(scryptCallback);
const SESSION_TTL_DAYS = 14;
const RESET_TTL_MINUTES = 30;

export const SESSION_COOKIE_NAME = "pokemon_forms_session";

export interface RequestMeta {
  ipAddress?: string | null;
  userAgent?: string | null;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function toAuthUser(user: typeof usersTable.$inferSelect): AuthUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    profileImageUrl: user.profileImageUrl,
  };
}

export class AuthService {
  public async hashPassword(password: string) {
    const salt = randomBytes(16).toString("base64url");
    const key = (await scrypt(password, salt, 64)) as Buffer;
    return `scrypt:${salt}:${key.toString("base64url")}`;
  }

  public async verifyPassword(password: string, storedHash: string) {
    const [algorithm, salt, hash] = storedHash.split(":");
    if (algorithm !== "scrypt" || !salt || !hash) return false;
    const key = (await scrypt(password, salt, 64)) as Buffer;
    const expected = Buffer.from(hash, "base64url");
    if (expected.length !== key.length) return false;
    return timingSafeEqual(expected, key);
  }

  public async register(input: { fullName: string; email: string; password: string }, meta?: RequestMeta) {
    const email = input.email.toLowerCase().trim();
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing[0]) throw new Error("An account already exists for this email.");

    const [user] = await db
      .insert(usersTable)
      .values({
        fullName: input.fullName.trim(),
        email,
        emailVerified: true,
        passwordHash: await this.hashPassword(input.password),
      })
      .returning();

    if (!user) throw new Error("Unable to create account.");
    const session = await this.createSession(user.id, meta);
    return { user: toAuthUser(user), ...session };
  }

  public async login(input: { email: string; password: string }, meta?: RequestMeta) {
    const email = input.email.toLowerCase().trim();
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user || !(await this.verifyPassword(input.password, user.passwordHash))) {
      throw new Error("Invalid email or password.");
    }

    await db.update(usersTable).set({ lastLoginAt: new Date() }).where(eq(usersTable.id, user.id));
    const session = await this.createSession(user.id, meta);
    return { user: toAuthUser(user), ...session };
  }

  public async createSession(userId: string, meta?: RequestMeta) {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
    await db.insert(sessionsTable).values({
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      ipAddress: meta?.ipAddress ?? null,
      userAgent: meta?.userAgent ?? null,
    });
    return { token, expiresAt };
  }

  public async getSession(token?: string | null) {
    if (!token) return null;
    const [row] = await db
      .select({ session: sessionsTable, user: usersTable })
      .from(sessionsTable)
      .innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
      .where(and(eq(sessionsTable.tokenHash, hashToken(token)), gt(sessionsTable.expiresAt, new Date())))
      .limit(1);

    if (!row) return null;
    return { session: row.session, user: toAuthUser(row.user) };
  }

  public async logout(token?: string | null) {
    if (!token) return;
    await db.delete(sessionsTable).where(eq(sessionsTable.tokenHash, hashToken(token)));
  }

  public async requestPasswordReset(emailInput: string) {
    const email = emailInput.toLowerCase().trim();
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) return { ok: true, devResetUrl: null };

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);
    await db.insert(passwordResetTokensTable).values({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt,
    });

    const devResetUrl = `${env.APP_URL}/reset-password?token=${token}`;
    await db.insert(emailEventsTable).values({
      userId: user.id,
      kind: "password_reset",
      toEmail: user.email,
      subject: "Reset your PokeForms password",
      previewText: `Use this secure reset link within ${RESET_TTL_MINUTES} minutes: ${devResetUrl}`,
      status: "queued",
    });

    return { ok: true, devResetUrl };
  }

  public async resetPassword(token: string, password: string) {
    const [reset] = await db
      .select()
      .from(passwordResetTokensTable)
      .where(
        and(
          eq(passwordResetTokensTable.tokenHash, hashToken(token)),
          gt(passwordResetTokensTable.expiresAt, new Date()),
          isNull(passwordResetTokensTable.usedAt),
        ),
      )
      .limit(1);

    if (!reset) throw new Error("Reset link is invalid or expired.");

    await db.update(usersTable).set({ passwordHash: await this.hashPassword(password) }).where(eq(usersTable.id, reset.userId));
    await db
      .update(passwordResetTokensTable)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokensTable.id, reset.id));
    await db.delete(sessionsTable).where(eq(sessionsTable.userId, reset.userId));

    return { ok: true };
  }

  public async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user || !(await this.verifyPassword(currentPassword, user.passwordHash))) {
      throw new Error("Current password is incorrect.");
    }
    await db.update(usersTable).set({ passwordHash: await this.hashPassword(newPassword) }).where(eq(usersTable.id, userId));
    await db.delete(sessionsTable).where(eq(sessionsTable.userId, userId));
    return { ok: true };
  }
}

export function serializeSessionCookie(token: string, expiresAt: Date) {
  const nodeEnv = process.env.NODE_ENV as string | undefined;
  const isProduction =
    nodeEnv === "production" || nodeEnv === "prod";

  return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=${
    isProduction ? "None" : "Lax"
  }; Expires=${expiresAt.toUTCString()}${
    isProduction ? "; Secure" : ""
  }`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
