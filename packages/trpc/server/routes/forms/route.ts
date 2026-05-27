import {
  analyticsSchema,
  createFormInputSchema,
  formDetailSchema,
  formSummarySchema,
  formThemeSchema,
  publicFormSchema,
  responseRowSchema,
  submitResponseInputSchema,
  submitResponseOutputSchema,
  updateFormInputSchema,
} from "@repo/forms";
import { TRPCError } from "@trpc/server";
import { z, zodUndefinedModel } from "../../schema";
import { formService } from "../../services";
import { protectedProcedure, publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Forms"];
const PUBLIC_TAGS = ["Public Forms"];
const getPath = generatePath("/forms");

function appBaseUrl(origin?: string) {
  return process.env.APP_URL ?? origin ?? "http://localhost:3000";
}

function toTRPCError(error: unknown, code: TRPCError["code"] = "BAD_REQUEST") {
  if (error instanceof TRPCError) return error;
  return new TRPCError({
    code,
    message: error instanceof Error ? error.message : "Unable to complete form request.",
  });
}

const dashboardSchema = z.object({
  totalForms: z.number().int().nonnegative(),
  publishedForms: z.number().int().nonnegative(),
  responses: z.number().int().nonnegative(),
  views: z.number().int().nonnegative(),
  starts: z.number().int().nonnegative(),
  completionRate: z.number().nonnegative(),
  recentResponses: z.array(
    z.object({
      id: z.string().uuid(),
      formId: z.string().uuid(),
      respondentEmail: z.string().nullable(),
      submittedAt: z.string(),
    }),
  ),
});

export const formsRouter = router({
  listThemes: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/themes"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.array(formThemeSchema))
    .query(() => formService.listThemes()),
  seedDemo: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/seed-demo"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(
      z.object({
        ok: z.boolean(),
        demoEmail: z.string().email(),
        demoPassword: z.string(),
        seededForms: z.number().int().positive(),
      }),
    )
    .mutation(() => formService.seedDemo()),
  dashboard: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/dashboard"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(dashboardSchema)
    .query(({ ctx }) => formService.dashboard(ctx.user.id)),
  listMine: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/mine"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.array(formDetailSchema))
    .query(({ ctx }) => formService.listMine(ctx.user.id, appBaseUrl(ctx.req.headers.origin))),
  getMine: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{id}"), tags: TAGS } })
    .input(z.object({ id: z.string().uuid() }))
    .output(formDetailSchema)
    .query(async ({ input, ctx }) => {
      try {
        return await formService.getMine(ctx.user.id, input.id, appBaseUrl(ctx.req.headers.origin));
      } catch (error) {
        throw toTRPCError(error, "NOT_FOUND");
      }
    }),
  create: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/create"), tags: TAGS } })
    .input(createFormInputSchema)
    .output(formDetailSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await formService.create(ctx.user.id, input, appBaseUrl(ctx.req.headers.origin));
      } catch (error) {
        throw toTRPCError(error);
      }
    }),
  update: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/update"), tags: TAGS } })
    .input(updateFormInputSchema)
    .output(formDetailSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await formService.update(ctx.user.id, input, appBaseUrl(ctx.req.headers.origin));
      } catch (error) {
        throw toTRPCError(error);
      }
    }),
  publish: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{id}/publish"), tags: TAGS } })
    .input(z.object({ id: z.string().uuid() }))
    .output(formDetailSchema)
    .mutation(async ({ input, ctx }) => formService.publish(ctx.user.id, input.id, appBaseUrl(ctx.req.headers.origin))),
  unpublish: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{id}/unpublish"), tags: TAGS } })
    .input(z.object({ id: z.string().uuid() }))
    .output(formDetailSchema)
    .mutation(async ({ input, ctx }) => formService.unpublish(ctx.user.id, input.id, appBaseUrl(ctx.req.headers.origin))),
  clone: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{id}/clone"), tags: TAGS } })
    .input(z.object({ id: z.string().uuid() }))
    .output(formDetailSchema)
    .mutation(async ({ input, ctx }) => formService.clone(ctx.user.id, input.id, appBaseUrl(ctx.req.headers.origin))),
  archive: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{id}/archive"), tags: TAGS } })
    .input(z.object({ id: z.string().uuid() }))
    .output(formDetailSchema)
    .mutation(async ({ input, ctx }) => formService.archive(ctx.user.id, input.id, appBaseUrl(ctx.req.headers.origin))),
  publicList: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/public"), tags: PUBLIC_TAGS } })
    .input(z.object({ query: z.string().optional().nullable() }))
    .output(z.array(formSummarySchema))
    .query(({ input }) => formService.listPublic(input.query)),
  publicGet: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/public/{slug}"), tags: PUBLIC_TAGS } })
    .input(z.object({ slug: z.string().min(1) }))
    .output(publicFormSchema)
    .query(async ({ input }) => {
      try {
        return await formService.getPublic(input.slug);
      } catch (error) {
        throw toTRPCError(error, "NOT_FOUND");
      }
    }),
  publicStart: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/public/{slug}/start"), tags: PUBLIC_TAGS } })
    .input(z.object({ slug: z.string().min(1) }))
    .output(z.object({ ok: z.boolean() }))
    .mutation(({ input }) => formService.startPublic(input.slug)),
  submit: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/public/{slug}/submit"), tags: PUBLIC_TAGS } })
    .input(submitResponseInputSchema)
    .output(submitResponseOutputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await formService.submit(
          input.slug,
          input.answers,
          {
            respondentEmail: input.respondentEmail,
            password: input.password,
            startedAt: input.startedAt,
          },
          {
            ipAddress: ctx.ipAddress,
            userAgent: ctx.userAgent,
          },
        );
      } catch (error) {
        throw toTRPCError(error);
      }
    }),
  responses: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{id}/responses"), tags: TAGS } })
    .input(z.object({ id: z.string().uuid(), page: z.number().int().positive().default(1).optional() }))
    .output(z.array(responseRowSchema))
    .query(({ input, ctx }) => formService.responses(ctx.user.id, input.id, input.page ?? 1)),
  analytics: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{id}/analytics"), tags: TAGS } })
    .input(z.object({ id: z.string().uuid() }))
    .output(analyticsSchema)
    .query(({ input, ctx }) => formService.analytics(ctx.user.id, input.id)),
  exportCsv: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{id}/export.csv"), tags: TAGS } })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ csv: z.string() }))
    .query(async ({ input, ctx }) => ({ csv: await formService.exportCsv(ctx.user.id, input.id) })),
});
