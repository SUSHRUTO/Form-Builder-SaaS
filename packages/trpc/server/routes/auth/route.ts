import {
  authUserSchema,
  changePasswordInputSchema,
  forgotPasswordInputSchema,
  loginInputSchema,
  registerInputSchema,
  resetPasswordInputSchema,
} from "@repo/forms";
import { TRPCError } from "@trpc/server";
import { clearSessionCookie, serializeSessionCookie } from "@repo/services/auth";
import { z, zodUndefinedModel } from "../../schema";
import { authService, formService, userService } from "../../services";
import { getAuthenticationMethodOutputSchema } from "@repo/services/user/model";
import { protectedProcedure, publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Authentication"];
const getPath = generatePath("/auth");

const authOutputSchema = z.object({
  user: authUserSchema,
});

function toTRPCError(error: unknown) {
  if (error instanceof TRPCError) return error;
  return new TRPCError({
    code: "BAD_REQUEST",
    message: error instanceof Error ? error.message : "Authentication failed.",
  });
}

export const authRouter = router({
  getSupportedAuthenticationProviders: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/supported-providers"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.readonly(z.array(getAuthenticationMethodOutputSchema)))
    .query(async () => {
      const supportedMethods = await userService.getAuthenticationMethods();
      return supportedMethods;
    }),
  me: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/me"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.object({ user: authUserSchema.nullable() }))
    .query(({ ctx }) => ({ user: ctx.user })),
  register: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/register"), tags: TAGS } })
    .input(registerInputSchema)
    .output(authOutputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await authService.register(input, {
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
        });
        ctx.res.setHeader("Set-Cookie", serializeSessionCookie(result.token, result.expiresAt));
        return { user: result.user };
      } catch (error) {
        throw toTRPCError(error);
      }
    }),
  login: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/login"), tags: TAGS } })
    .input(loginInputSchema)
    .output(authOutputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const isDemoLogin =
          input.email.toLowerCase().trim() === formService.demoCredentials.email &&
          input.password === formService.demoCredentials.password;
        if (isDemoLogin) {
          await formService.seedDemo();
        }
        const result = await authService.login(input, {
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
        });
        ctx.res.setHeader("Set-Cookie", serializeSessionCookie(result.token, result.expiresAt));
        return { user: result.user };
      } catch (error) {
        throw toTRPCError(error);
      }
    }),
   logout: protectedProcedure
  .meta({
    openapi: {
      method: "POST",
      path: getPath("/logout"),
      tags: TAGS,
    },
  })
  .input(z.object({}).optional())
  .output(
    z.object({
      ok: z.boolean(),
    })
  )
    .mutation(async ({ ctx }) => {
      await authService.logout(ctx.sessionToken);
      ctx.res.setHeader("Set-Cookie", clearSessionCookie());
      return { ok: true };
    }),
  forgotPassword: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/forgot-password"), tags: TAGS } })
    .input(forgotPasswordInputSchema)
    .output(z.object({ ok: z.boolean(), devResetUrl: z.string().nullable() }))
    .mutation(async ({ input }) => {
      try {
        return await authService.requestPasswordReset(input.email);
      } catch (error) {
        throw toTRPCError(error);
      }
    }),
  resetPassword: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/reset-password"), tags: TAGS } })
    .input(resetPasswordInputSchema)
    .output(z.object({ ok: z.boolean() }))
    .mutation(async ({ input }) => {
      try {
        return await authService.resetPassword(input.token, input.password);
      } catch (error) {
        throw toTRPCError(error);
      }
    }),
  changePassword: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/change-password"), tags: TAGS } })
    .input(changePasswordInputSchema)
    .output(z.object({ ok: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await authService.changePassword(ctx.user.id, input.currentPassword, input.newPassword);
        ctx.res.setHeader("Set-Cookie", clearSessionCookie());
        return result;
      } catch (error) {
        throw toTRPCError(error);
      }
    }),
});
