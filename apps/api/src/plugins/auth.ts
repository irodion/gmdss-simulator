import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import fp from "fastify-plugin";

import { createAuth, type Auth } from "../lib/auth.ts";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

declare module "fastify" {
  interface FastifyInstance {
    auth: Auth;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user: AuthUser;
  }
}

async function authPlugin(
  fastify: FastifyInstance,
  opts: { secret: string; baseURL: string; appURL: string },
) {
  const auth = createAuth(fastify.db, {
    secret: opts.secret,
    baseURL: opts.baseURL,
    appURL: opts.appURL,
  });

  fastify.decorate("auth", auth);
  fastify.decorateRequest("user", null as unknown as AuthUser);

  // Mount better-auth handler as catch-all
  fastify.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    handler: async (request, reply) => {
      const url = new URL(request.url, opts.baseURL);
      const headers = fromNodeHeaders(request.headers);
      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        body: request.body ? JSON.stringify(request.body) : undefined,
      });

      const response = await auth.handler(req);

      reply.status(response.status);

      // Forward all headers, handling Set-Cookie separately
      // since Headers.forEach merges multiple Set-Cookie values
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() !== "set-cookie") {
          reply.header(key, value);
        }
      });
      for (const cookie of response.headers.getSetCookie()) {
        void reply.header("set-cookie", cookie);
      }

      const text = await response.text();
      // nosemgrep: javascript.express.security.audit.xss.direct-response-write.direct-response-write
      return reply.send(text);
    },
  });

  // Authenticate helper for protected routes
  fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    request.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    };
  });
}

export default fp(authPlugin, { name: "auth", dependencies: ["db"] });
