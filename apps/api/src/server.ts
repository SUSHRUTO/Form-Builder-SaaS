import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";

import * as trpcExpress from "@trpc/server/adapters/express";
import {
  generateOpenApiDocument,
  createOpenApiExpressMiddleware,
} from "trpc-to-openapi";

import { serverRouter, createContext } from "@repo/trpc/server";
import { env } from "./env";

export const app = express();

const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "PokeForms OpenAPI",
  version: "1.0.0",
  baseUrl: env.BASE_URL.concat("/api"),
});

app.set("trust proxy", 1);

const isProduction =
  env.NODE_ENV === "production" ||
  env.NODE_ENV === "prod";

app.use(
  cors({
    origin: isProduction ? env.APP_URL : true,
    credentials: true,
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  return res.json({
    message: "PokeForms API is up and running...",
  });
});

app.get("/health", (req, res) => {
  return res.json({
    message: "PokeForms server is healthy",
    healthy: true,
  });
});

logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);

app.get("/openapi.json", (req, res) => {
  return res.json(openApiDocument);
});

logger.debug(`docs: ${env.BASE_URL}/docs`);

// Fix for ESM-only Scalar package
(async () => {
  const { apiReference } = await import(
    "@scalar/express-api-reference"
  );

  app.use(
    "/docs",
    apiReference({
      url: "/openapi.json",
    }),
  );
})();

app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

export default app;