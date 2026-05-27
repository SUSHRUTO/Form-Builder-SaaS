import { createHash } from "node:crypto";
import {
  analyticsSchema,
  buildResponseSchema,
  createFormInputSchema,
  defaultFieldsForType,
  formDetailSchema,
  formSummarySchema,
  formThemeSchema,
  pokemonImage,
  responseRowSchema,
  samplePokemonForms,
  samplePokemonThemes,
  slugify,
  updateFormInputSchema,
  type FormDetail,
  type FormFieldInput,
  type FormFieldOutput,
  type FormSummary,
  type FormTheme,
} from "@repo/forms";
import {
  and,
  asc,
  count,
  db,
  desc,
  eq,
  ilike,
  inArray,
  ne,
  or,
  sql,
} from "@repo/database";
import {
  emailEventsTable,
  formFieldsTable,
  formResponsesTable,
  formThemesTable,
  formsTable,
  usersTable,
  type SelectForm,
  type SelectFormField,
  type SelectFormTheme,
} from "@repo/database/schema";
import { AuthService } from "../auth";

const auth = new AuthService();

const demoPassword = "Pikachu@2026";
const demoEmail = "demo@pokebuilder.dev";

const ipWindow = new Map<string, number[]>();

export interface SubmissionMeta {
  ipAddress?: string | null;
  userAgent?: string | null;
}

function iso(value?: Date | null) {
  return value ? value.toISOString() : null;
}

function ipHash(ip?: string | null) {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex");
}

function toTheme(theme?: SelectFormTheme | null): FormTheme | null {
  if (!theme) return null;
  return formThemeSchema.parse({
    id: theme.id,
    name: theme.name,
    pokemonType: theme.pokemonType,
    accentColor: theme.accentColor,
    backgroundColor: theme.backgroundColor,
    cardColor: theme.cardColor,
    textColor: theme.textColor,
    imageUrl: theme.imageUrl,
    fontFamily: theme.fontFamily,
    aura: theme.aura,
  });
}

function toField(field: SelectFormField): FormFieldOutput {
  return {
    id: field.id,
    key: field.key,
    type: field.type,
    label: field.label,
    helpText: field.helpText,
    placeholder: field.placeholder,
    required: field.required,
    order: field.order,
    options: field.options ?? [],
    validations: field.validations ?? {},
    conditionalLogic: field.conditionalLogic ?? [],
  };
}

function completionRate(starts: number, responses: number) {
  if (starts <= 0) return responses > 0 ? 100 : 0;
  return Math.min(100, Math.round((responses / starts) * 100));
}

async function responseCount(formId: string) {
  const [row] = await db.select({ value: count() }).from(formResponsesTable).where(eq(formResponsesTable.formId, formId));
  return Number(row?.value ?? 0);
}

async function themeById(themeId?: string | null) {
  if (!themeId) return null;
  const [theme] = await db.select().from(formThemesTable).where(eq(formThemesTable.id, themeId)).limit(1);
  return theme ?? null;
}

async function serializeSummary(form: SelectForm, theme?: SelectFormTheme | null): Promise<FormSummary> {
  const responses = await responseCount(form.id);
  return formSummarySchema.parse({
    id: form.id,
    title: form.title,
    description: form.description,
    slug: form.slug,
    status: form.status,
    visibility: form.visibility,
    pokemonType: form.pokemonType,
    coverImageUrl: form.coverImageUrl,
    theme: toTheme(theme),
    responseCount: responses,
    viewCount: form.viewCount,
    startsCount: form.startsCount,
    completionRate: completionRate(form.startsCount, responses),
    publishedAt: iso(form.publishedAt),
    updatedAt: form.updatedAt.toISOString(),
  });
}

async function serializeDetail(form: SelectForm, baseUrl: string): Promise<FormDetail> {
  const fields = await db
    .select()
    .from(formFieldsTable)
    .where(eq(formFieldsTable.formId, form.id))
    .orderBy(asc(formFieldsTable.order));
  const theme = await themeById(form.themeId);
  const summary = await serializeSummary(form, theme);
  return formDetailSchema.parse({
    ...summary,
    fields: fields.map(toField),
    thankYouTitle: form.thankYouTitle,
    thankYouMessage: form.thankYouMessage,
    notificationEmail: form.notificationEmail,
    expiresAt: iso(form.expiresAt),
    responseLimit: form.responseLimit,
    passwordProtected: Boolean(form.passwordHash),
    shareUrl: `${baseUrl}/f/${form.slug}`,
  });
}

async function ensureUniqueSlug(slug: string, ignoreFormId?: string) {
  let candidate = slugify(slug) || "pokemon-form";
  let index = 2;

  while (true) {
    const where = ignoreFormId
      ? and(eq(formsTable.slug, candidate), ne(formsTable.id, ignoreFormId))
      : eq(formsTable.slug, candidate);
    const [existing] = await db.select({ id: formsTable.id }).from(formsTable).where(where).limit(1);
    if (!existing) return candidate;
    candidate = `${slugify(slug)}-${index}`;
    index += 1;
  }
}

function normalizeFields(fields: FormFieldInput[], pokemonType: SelectForm["pokemonType"]) {
  const source = fields.length ? fields : defaultFieldsForType(pokemonType);
  return source.map((field, index) => ({
    ...field,
    key: field.key ?? slugify(field.label).replace(/-/g, "_"),
    order: index,
    options: field.options ?? [],
    validations: field.validations ?? {},
    conditionalLogic: field.conditionalLogic ?? [],
  }));
}

function assertPublishedAndAvailable(form: SelectForm, responses: number) {
  if (form.status !== "published") throw new Error("This form is not accepting responses right now.");
  if (form.expiresAt && form.expiresAt.getTime() < Date.now()) throw new Error("This form has expired.");
  if (form.responseLimit && responses >= form.responseLimit) throw new Error("This form has reached its response limit.");
}

function checkRateLimit(formId: string, ip?: string | null) {
  const identity = `${formId}:${ip ?? "unknown"}`;
  const now = Date.now();
  const recent = (ipWindow.get(identity) ?? []).filter((value) => now - value < 60_000);
  if (recent.length >= 6) throw new Error("Too many submissions. Please wait a minute and try again.");
  recent.push(now);
  ipWindow.set(identity, recent);
}

export class FormService {
  public demoCredentials = {
    email: demoEmail,
    password: demoPassword,
  };

  public async listThemes() {
    let rows = await db.select().from(formThemesTable).orderBy(asc(formThemesTable.name));
    if (!rows.length) {
      await this.seedDemo();
      rows = await db.select().from(formThemesTable).orderBy(asc(formThemesTable.name));
    }
    return rows.map(toTheme).filter((theme): theme is FormTheme => Boolean(theme));
  }

  public async listMine(ownerId: string, baseUrl: string) {
    const rows = await db
      .select({ form: formsTable, theme: formThemesTable })
      .from(formsTable)
      .leftJoin(formThemesTable, eq(formsTable.themeId, formThemesTable.id))
      .where(eq(formsTable.ownerId, ownerId))
      .orderBy(desc(formsTable.updatedAt));

    return Promise.all(rows.map((row) => serializeDetail(row.form, baseUrl)));
  }

  public async dashboard(ownerId: string) {
    const forms = await db.select().from(formsTable).where(eq(formsTable.ownerId, ownerId));
    const formIds = forms.map((form) => form.id);
    const responseRows = formIds.length
      ? await db.select().from(formResponsesTable).where(inArray(formResponsesTable.formId, formIds))
      : [];
    const published = forms.filter((form) => form.status === "published").length;
    const views = forms.reduce((total, form) => total + form.viewCount, 0);
    const starts = forms.reduce((total, form) => total + form.startsCount, 0);
    return {
      totalForms: forms.length,
      publishedForms: published,
      responses: responseRows.length,
      views,
      starts,
      completionRate: completionRate(starts, responseRows.length),
      recentResponses: responseRows
        .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
        .slice(0, 5)
        .map((response) => ({
          id: response.id,
          formId: response.formId,
          respondentEmail: response.respondentEmail,
          submittedAt: response.submittedAt.toISOString(),
        })),
    };
  }

  public async getMine(ownerId: string, formId: string, baseUrl: string) {
    const [form] = await db.select().from(formsTable).where(and(eq(formsTable.id, formId), eq(formsTable.ownerId, ownerId))).limit(1);
    if (!form) throw new Error("Form not found.");
    return serializeDetail(form, baseUrl);
  }

  public async create(ownerId: string, inputRaw: unknown, baseUrl: string) {
    const input = createFormInputSchema.parse(inputRaw);
    const slug = await ensureUniqueSlug(input.slug ?? input.title);
    const fields = normalizeFields(input.fields ?? defaultFieldsForType(input.pokemonType), input.pokemonType);
    const passwordHash = input.password ? await auth.hashPassword(input.password) : null;
    const [form] = await db
      .insert(formsTable)
      .values({
        ownerId,
        title: input.title,
        description: input.description ?? null,
        slug,
        visibility: input.visibility,
        themeId: input.themeId ?? null,
        pokemonType: input.pokemonType,
        coverImageUrl: input.coverImageUrl ?? pokemonImage(25),
        passwordHash,
        notificationEmail: input.notificationEmail ?? null,
        thankYouTitle: input.thankYouTitle ?? "Your Pokeball landed!",
        thankYouMessage:
          input.thankYouMessage ?? "Thanks for submitting. The creator has your response in their trainer console.",
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        responseLimit: input.responseLimit ?? null,
      })
      .returning();

    if (!form) throw new Error("Unable to create form.");

    await db.insert(formFieldsTable).values(
      fields.map((field) => ({
        formId: form.id,
        key: field.key,
        type: field.type,
        label: field.label,
        helpText: field.helpText ?? null,
        placeholder: field.placeholder ?? null,
        required: field.required,
        order: field.order,
        options: field.options,
        validations: field.validations,
        conditionalLogic: field.conditionalLogic,
      })),
    );

    return serializeDetail(form, baseUrl);
  }

  public async update(ownerId: string, inputRaw: unknown, baseUrl: string) {
    const input = updateFormInputSchema.parse(inputRaw);
    const [current] = await db.select().from(formsTable).where(and(eq(formsTable.id, input.id), eq(formsTable.ownerId, ownerId))).limit(1);
    if (!current) throw new Error("Form not found.");
    const slug = input.slug ? await ensureUniqueSlug(input.slug, current.id) : undefined;
    const passwordHash = input.password === undefined ? undefined : input.password ? await auth.hashPassword(input.password) : null;
    const [form] = await db
      .update(formsTable)
      .set({
        title: input.title,
        description: input.description,
        slug,
        visibility: input.visibility,
        themeId: input.themeId,
        pokemonType: input.pokemonType,
        coverImageUrl: input.coverImageUrl,
        passwordHash,
        notificationEmail: input.notificationEmail,
        thankYouTitle: input.thankYouTitle,
        thankYouMessage: input.thankYouMessage,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : input.expiresAt === null ? null : undefined,
        responseLimit: input.responseLimit,
        updatedAt: new Date(),
      })
      .where(and(eq(formsTable.id, input.id), eq(formsTable.ownerId, ownerId)))
      .returning();

    if (!form) throw new Error("Unable to update form.");

    if (input.fields) {
      const fields = normalizeFields(input.fields, form.pokemonType);
      await db.delete(formFieldsTable).where(eq(formFieldsTable.formId, form.id));
      await db.insert(formFieldsTable).values(
        fields.map((field) => ({
          formId: form.id,
          key: field.key,
          type: field.type,
          label: field.label,
          helpText: field.helpText ?? null,
          placeholder: field.placeholder ?? null,
          required: field.required,
          order: field.order,
          options: field.options,
          validations: field.validations,
          conditionalLogic: field.conditionalLogic,
        })),
      );
    }

    return serializeDetail(form, baseUrl);
  }

  public async publish(ownerId: string, formId: string, baseUrl: string) {
    const [form] = await db
      .update(formsTable)
      .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(formsTable.id, formId), eq(formsTable.ownerId, ownerId)))
      .returning();
    if (!form) throw new Error("Form not found.");
    return serializeDetail(form, baseUrl);
  }

  public async unpublish(ownerId: string, formId: string, baseUrl: string) {
    const [form] = await db
      .update(formsTable)
      .set({ status: "draft", updatedAt: new Date() })
      .where(and(eq(formsTable.id, formId), eq(formsTable.ownerId, ownerId)))
      .returning();
    if (!form) throw new Error("Form not found.");
    return serializeDetail(form, baseUrl);
  }

  public async clone(ownerId: string, formId: string, baseUrl: string) {
    const source = await this.getMine(ownerId, formId, baseUrl);
    return this.create(
      ownerId,
      {
        title: `${source.title} copy`,
        description: source.description,
        visibility: "unlisted",
        pokemonType: source.pokemonType,
        coverImageUrl: source.coverImageUrl,
        themeId: source.theme?.id,
        fields: source.fields,
      },
      baseUrl,
    );
  }

  public async archive(ownerId: string, formId: string, baseUrl: string) {
    const [form] = await db
      .update(formsTable)
      .set({ status: "archived", archivedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(formsTable.id, formId), eq(formsTable.ownerId, ownerId)))
      .returning();
    if (!form) throw new Error("Form not found.");
    return serializeDetail(form, baseUrl);
  }

  public async listPublic(query?: string | null) {
    const loadRows = () =>
      db
        .select({ form: formsTable, theme: formThemesTable })
        .from(formsTable)
        .leftJoin(formThemesTable, eq(formsTable.themeId, formThemesTable.id))
        .where(
          and(
            eq(formsTable.status, "published"),
            eq(formsTable.visibility, "public"),
            query
              ? or(ilike(formsTable.title, `%${query}%`), ilike(formsTable.description, `%${query}%`), ilike(formsTable.slug, `%${query}%`))
              : sql`true`,
          ),
        )
        .orderBy(desc(formsTable.publishedAt), desc(formsTable.updatedAt));

    let rows = await loadRows();
    if (!rows.length && !query) {
      await this.seedDemo();
      rows = await loadRows();
    }
    return Promise.all(rows.map((row) => serializeSummary(row.form, row.theme)));
  }

  public async getPublic(slug: string) {
    const [form] = await db.select().from(formsTable).where(eq(formsTable.slug, slug)).limit(1);
    if (!form || form.status !== "published") throw new Error("This form is unavailable.");
    const responses = await responseCount(form.id);
    assertPublishedAndAvailable(form, responses);
    const fields = await db
      .select()
      .from(formFieldsTable)
      .where(eq(formFieldsTable.formId, form.id))
      .orderBy(asc(formFieldsTable.order));
    const theme = await themeById(form.themeId);
    await db.update(formsTable).set({ viewCount: form.viewCount + 1 }).where(eq(formsTable.id, form.id));
    return {
      id: form.id,
      title: form.title,
      description: form.description,
      slug: form.slug,
      visibility: form.visibility,
      pokemonType: form.pokemonType,
      coverImageUrl: form.coverImageUrl,
      fields: fields.map(toField),
      theme: toTheme(theme),
      passwordProtected: Boolean(form.passwordHash),
      thankYouTitle: form.thankYouTitle,
      thankYouMessage: form.thankYouMessage,
      expiresAt: iso(form.expiresAt),
      responseLimit: form.responseLimit,
    };
  }

  public async startPublic(slug: string) {
    const [form] = await db.select().from(formsTable).where(eq(formsTable.slug, slug)).limit(1);
    if (!form || form.status !== "published") return { ok: true };
    await db.update(formsTable).set({ startsCount: form.startsCount + 1 }).where(eq(formsTable.id, form.id));
    return { ok: true };
  }

  public async submit(slug: string, answers: Record<string, unknown>, input: { respondentEmail?: string | null; password?: string | null; startedAt?: string | null }, meta?: SubmissionMeta) {
    const [form] = await db.select().from(formsTable).where(eq(formsTable.slug, slug)).limit(1);
    if (!form) throw new Error("This form is unavailable.");
    const responses = await responseCount(form.id);
    assertPublishedAndAvailable(form, responses);
    checkRateLimit(form.id, meta?.ipAddress);

    if (form.passwordHash) {
      if (!input.password || !(await auth.verifyPassword(input.password, form.passwordHash))) {
        throw new Error("This form needs the correct password.");
      }
    }

    const fields = await db
      .select()
      .from(formFieldsTable)
      .where(eq(formFieldsTable.formId, form.id))
      .orderBy(asc(formFieldsTable.order));
    const parsedFields = fields.map(toField);
    const parsed = buildResponseSchema(parsedFields).safeParse(answers);
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Response failed validation.");

    const startedAt = input.startedAt ? new Date(input.startedAt) : null;
    const spamScore = startedAt && Date.now() - startedAt.getTime() < 1500 ? 10 : 0;
    const [response] = await db
      .insert(formResponsesTable)
      .values({
        formId: form.id,
        respondentEmail: input.respondentEmail ?? null,
        answers: parsed.data,
        metadata: {
          startedAt: input.startedAt ?? null,
          pokemonType: form.pokemonType,
        },
        ipHash: ipHash(meta?.ipAddress),
        userAgent: meta?.userAgent ?? null,
        spamScore,
      })
      .returning();

    if (!response) throw new Error("Unable to submit response.");

    if (form.notificationEmail) {
      await db.insert(emailEventsTable).values({
        formId: form.id,
        responseId: response.id,
        kind: "creator_response_notification",
        toEmail: form.notificationEmail,
        subject: `New response for ${form.title}`,
        previewText: `A respondent submitted ${form.title}. Open the dashboard to review their answers.`,
        status: "queued",
      });
    }

    if (input.respondentEmail) {
      await db.insert(emailEventsTable).values({
        formId: form.id,
        responseId: response.id,
        kind: "respondent_confirmation",
        toEmail: input.respondentEmail,
        subject: `Thanks for completing ${form.title}`,
        previewText: form.thankYouMessage ?? "Thanks for submitting your Pokemon-world response.",
        status: "queued",
      });
    }

    return {
      responseId: response.id,
      thankYouTitle: form.thankYouTitle ?? "Your Pokeball landed!",
      thankYouMessage:
        form.thankYouMessage ?? "Thanks for submitting. The creator has your response in their trainer console.",
    };
  }

  public async responses(ownerId: string, formId: string, page = 1) {
    const [form] = await db.select().from(formsTable).where(and(eq(formsTable.id, formId), eq(formsTable.ownerId, ownerId))).limit(1);
    if (!form) throw new Error("Form not found.");
    const rows = await db
      .select()
      .from(formResponsesTable)
      .where(eq(formResponsesTable.formId, formId))
      .orderBy(desc(formResponsesTable.submittedAt))
      .limit(25)
      .offset((page - 1) * 25);
    return rows.map((row) =>
      responseRowSchema.parse({
        id: row.id,
        formId: row.formId,
        respondentEmail: row.respondentEmail,
        answers: row.answers,
        metadata: row.metadata,
        submittedAt: row.submittedAt.toISOString(),
      }),
    );
  }

  public async analytics(ownerId: string, formId: string) {
    const [form] = await db.select().from(formsTable).where(and(eq(formsTable.id, formId), eq(formsTable.ownerId, ownerId))).limit(1);
    if (!form) throw new Error("Form not found.");
    const fields = (await db.select().from(formFieldsTable).where(eq(formFieldsTable.formId, formId)).orderBy(asc(formFieldsTable.order))).map(toField);
    const responses = await db.select().from(formResponsesTable).where(eq(formResponsesTable.formId, formId));
    const choiceFields = fields.filter((field) => ["single_select", "multi_select", "checkbox", "rating"].includes(field.type));
    const choiceBreakdown = choiceFields.map((field) => {
      const buckets = new Map<string, number>();
      for (const response of responses) {
        const value = response.answers[field.id];
        const values = Array.isArray(value) ? value : value === undefined || value === null ? [] : [String(value)];
        for (const item of values) buckets.set(String(item), (buckets.get(String(item)) ?? 0) + 1);
      }
      return {
        fieldId: field.id,
        label: field.label,
        values: [...buckets.entries()].map(([value, valueCount]) => ({ value, count: valueCount })),
      };
    });
    const daily = new Map<string, number>();
    for (const response of responses) {
      const day = response.submittedAt.toISOString().slice(0, 10);
      daily.set(day, (daily.get(day) ?? 0) + 1);
    }
    return analyticsSchema.parse({
      formId,
      views: form.viewCount,
      starts: form.startsCount,
      submissions: responses.length,
      completionRate: completionRate(form.startsCount, responses.length),
      topFields: fields.map((field) => ({
        fieldId: field.id,
        label: field.label,
        answerCount: responses.filter((response) => response.answers[field.id] !== undefined).length,
      })),
      choiceBreakdown,
      dailyResponses: [...daily.entries()].map(([date, value]) => ({ date, count: value })),
    });
  }

  public async exportCsv(ownerId: string, formId: string) {
    const detail = await this.getMine(ownerId, formId, "http://localhost:3000");
    const responses = await this.responses(ownerId, formId, 1);
    const headers = ["submitted_at", "respondent_email", ...detail.fields.map((field) => field.label)];
    const rows = responses.map((response) => [
      response.submittedAt,
      response.respondentEmail ?? "",
      ...detail.fields.map((field) => JSON.stringify(response.answers[field.id] ?? "")),
    ]);
    return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  }

  public async seedDemo() {
    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, demoEmail)).limit(1);
    if (!user) {
      [user] = await db
        .insert(usersTable)
        .values({
          fullName: "Misty Oak",
          email: demoEmail,
          emailVerified: true,
          passwordHash: await auth.hashPassword(demoPassword),
          profileImageUrl: pokemonImage(54),
        })
        .returning();
    } else if (!(await auth.verifyPassword(demoPassword, user.passwordHash))) {
      [user] = await db
        .update(usersTable)
        .set({
          fullName: user.fullName || "Misty Oak",
          emailVerified: true,
          passwordHash: await auth.hashPassword(demoPassword),
          profileImageUrl: user.profileImageUrl ?? pokemonImage(54),
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, user.id))
        .returning();
    }

    if (!user) throw new Error("Unable to seed demo user.");

    const existingThemes = await db.select().from(formThemesTable);
    const themeByName = new Map(existingThemes.map((theme) => [theme.name, theme]));
    for (const theme of samplePokemonThemes) {
      if (!themeByName.has(theme.name)) {
        const [created] = await db.insert(formThemesTable).values(theme).returning();
        if (created) themeByName.set(created.name, created);
      }
    }

    for (const sample of samplePokemonForms) {
      const [existing] = await db.select().from(formsTable).where(eq(formsTable.slug, sample.slug)).limit(1);
      if (existing) {
        await db
          .update(formsTable)
          .set({
            status: "published",
            visibility: sample.visibility,
            publishedAt: existing.publishedAt ?? new Date(),
            updatedAt: new Date(),
          })
          .where(eq(formsTable.id, existing.id));
        await this.seedResponses(sample.slug);
        continue;
      }
      const theme = themeByName.get(sample.themeName);
      const form = await this.create(
        user.id,
        {
          title: sample.title,
          slug: sample.slug,
          description: sample.description,
          visibility: sample.visibility,
          pokemonType: sample.pokemonType,
          themeId: theme?.id,
          coverImageUrl: sample.coverImageUrl,
          notificationEmail: sample.notificationEmail,
          fields: sample.fields,
        },
        "http://localhost:3000",
      );
      await this.publish(user.id, form.id, "http://localhost:3000");
      await this.seedResponses(form.slug);
    }

    return {
      ok: true,
      demoEmail,
      demoPassword,
      seededForms: samplePokemonForms.length,
    };
  }

  private async seedResponses(slug: string) {
  const publicForm = await this.getPublic(slug);
  const sampleTrainers = ["Ash", "Misty", "Brock", "Serena", "Dawn", "Clemont"];

  for (const trainer of sampleTrainers) {
    const existing = await responseCount(publicForm.id);
    if (existing >= sampleTrainers.length) return;

    const answers: Record<string, unknown> = {};

    for (const field of publicForm.fields) {
      if (field.type === "email") {
        answers[field.id] = `${trainer.toLowerCase()}@pokemon.world`;
      } else if (field.type === "rating") {
        answers[field.id] = 4;
      } else if (field.type === "single_select") {
        answers[field.id] = field.options[0]?.value ?? "";
      } else if (field.type === "multi_select") {
        answers[field.id] = field.options.slice(0, 2).map((option) => option.value);
      } else if (field.type === "checkbox") {
        answers[field.id] = true;
      } else if (field.type === "number") {
        const max =
          typeof field.validations?.max === "number"
            ? field.validations.max
            : 10;

        const min =
          typeof field.validations?.min === "number"
            ? field.validations.min
            : 1;

        answers[field.id] = Math.min(max, Math.max(min, 5));
      } else if (field.type === "date") {
        answers[field.id] = "2026-05-20";
      } else {
        answers[field.id] =
          `${trainer} brings ${publicForm.pokemonType} energy and a badge-ready team.`;
      }
    }

    await this.submit(
      slug,
      answers,
      {
        respondentEmail: `${trainer.toLowerCase()}@pokemon.world`,
        startedAt: new Date(Date.now() - 20000).toISOString(),
      },
      {
        ipAddress: `seed-${trainer}`,
        userAgent: "seed-script",
      }
    );
  }
}
} 

function csvCell(value: string) {
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}