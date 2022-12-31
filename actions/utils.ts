import { Context } from "https://deno.land/x/hono@v2.6.2/mod.ts";

export function hash(str: string, seed = 0) {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export function funcToHash(fn: string) {
  const trimmed = fn.replaceAll(/[\r\n]+/g, "").replaceAll(" ", "").replaceAll(
    ";",
    "",
  ).replaceAll(/[^A-Za-z0-9]/g, "").trim();
  console.log(trimmed);
  const hashed = hash(trimmed).toString();
  return hashed;
}

export function customContext(ctx: Context) {
  function jsonResponse<T extends Record<string | number, unknown>>(data: T) {
    return ctx.json(data) as unknown as T;
  }
  return {
    _hono: { ...ctx },
    request: {
      headers: ctx.req.headers,
      cookie: ctx.req.cookie,
      url: ctx.req.url,
    },
    response: {
      json: jsonResponse,
      notFound: ctx.notFound,
      redirect: ctx.redirect,
      status: ctx.status,
      headers: ctx.res.headers,
      cookie: ctx.cookie,
    },
  };
}

export type CustomContext = ReturnType<typeof customContext>;

export function buildCustomContext(ctx: Context) {
  return customContext(ctx);
}
