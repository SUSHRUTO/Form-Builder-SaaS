import type {
  FieldCondition,
  FieldOption,
  FieldValidation,
  FormStatus,
  FormVisibility,
  PokemonType,
} from "@repo/forms";
import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const pokemonTypeEnum = pgEnum("pokemon_type", [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
]);

export const formVisibilityEnum = pgEnum("form_visibility", ["public", "unlisted"]);
export const formStatusEnum = pgEnum("form_status", ["draft", "published", "archived"]);
export const fieldTypeEnum = pgEnum("field_type", [
  "short_text",
  "long_text",
  "email",
  "number",
  "single_select",
  "multi_select",
  "checkbox",
  "rating",
  "date",
]);

export const formThemesTable = pgTable(
  "form_themes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id").references(() => usersTable.id, { onDelete: "set null" }),
    name: varchar("name", { length: 120 }).notNull(),
    pokemonType: pokemonTypeEnum("pokemon_type").$type<PokemonType>().notNull(),
    accentColor: varchar("accent_color", { length: 24 }).notNull(),
    backgroundColor: varchar("background_color", { length: 24 }).notNull(),
    cardColor: varchar("card_color", { length: 24 }).notNull(),
    textColor: varchar("text_color", { length: 24 }).notNull(),
    imageUrl: text("image_url").notNull(),
    fontFamily: varchar("font_family", { length: 80 }).notNull().default("Geist"),
    aura: text("aura").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    themeTypeIdx: index("form_themes_type_idx").on(table.pokemonType),
  }),
);

export const formsTable = pgTable(
  "forms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    themeId: uuid("theme_id").references(() => formThemesTable.id, { onDelete: "set null" }),
    title: varchar("title", { length: 120 }).notNull(),
    description: text("description"),
    slug: varchar("slug", { length: 96 }).notNull(),
    status: formStatusEnum("status").$type<FormStatus>().notNull().default("draft"),
    visibility: formVisibilityEnum("visibility").$type<FormVisibility>().notNull().default("unlisted"),
    pokemonType: pokemonTypeEnum("pokemon_type").$type<PokemonType>().notNull().default("electric"),
    coverImageUrl: text("cover_image_url"),
    passwordHash: text("password_hash"),
    notificationEmail: varchar("notification_email", { length: 255 }),
    thankYouTitle: varchar("thank_you_title", { length: 120 }).default("Your Pokeball landed!"),
    thankYouMessage: text("thank_you_message").default(
      "Thanks for submitting. The creator has your response in their trainer console.",
    ),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    responseLimit: integer("response_limit"),
    viewCount: integer("view_count").notNull().default(0),
    startsCount: integer("starts_count").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("forms_slug_idx").on(table.slug),
    ownerIdx: index("forms_owner_id_idx").on(table.ownerId),
    publicIdx: index("forms_public_listing_idx").on(table.status, table.visibility),
  }),
);

export const formFieldsTable = pgTable(
  "form_fields",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => formsTable.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 72 }).notNull(),
    type: fieldTypeEnum("type").notNull(),
    label: varchar("label", { length: 160 }).notNull(),
    helpText: text("help_text"),
    placeholder: varchar("placeholder", { length: 160 }),
    required: boolean("required").notNull().default(false),
    order: integer("field_order").notNull().default(0),
    options: jsonb("options").$type<FieldOption[]>().notNull().default(sql`'[]'::jsonb`),
    validations: jsonb("validations").$type<FieldValidation>().notNull().default(sql`'{}'::jsonb`),
    conditionalLogic: jsonb("conditional_logic")
      .$type<FieldCondition[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    fieldFormIdx: index("form_fields_form_id_idx").on(table.formId),
  }),
);

export const formResponsesTable = pgTable(
  "form_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => formsTable.id, { onDelete: "cascade" }),
    respondentEmail: varchar("respondent_email", { length: 255 }),
    answers: jsonb("answers").$type<Record<string, unknown>>().notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    spamScore: integer("spam_score").notNull().default(0),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    responseFormIdx: index("form_responses_form_id_idx").on(table.formId),
    responseSubmittedIdx: index("form_responses_submitted_at_idx").on(table.submittedAt),
  }),
);

export const emailEventsTable = pgTable(
  "email_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),
    formId: uuid("form_id").references(() => formsTable.id, { onDelete: "cascade" }),
    responseId: uuid("response_id").references(() => formResponsesTable.id, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 48 }).notNull(),
    toEmail: varchar("to_email", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 180 }).notNull(),
    previewText: text("preview_text").notNull(),
    status: varchar("status", { length: 32 }).notNull().default("queued"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailUserIdx: index("email_events_user_id_idx").on(table.userId),
    emailFormIdx: index("email_events_form_id_idx").on(table.formId),
  }),
);

export type SelectFormTheme = typeof formThemesTable.$inferSelect;
export type InsertFormTheme = typeof formThemesTable.$inferInsert;
export type SelectForm = typeof formsTable.$inferSelect;
export type InsertForm = typeof formsTable.$inferInsert;
export type SelectFormField = typeof formFieldsTable.$inferSelect;
export type InsertFormField = typeof formFieldsTable.$inferInsert;
export type SelectFormResponse = typeof formResponsesTable.$inferSelect;
export type InsertFormResponse = typeof formResponsesTable.$inferInsert;
