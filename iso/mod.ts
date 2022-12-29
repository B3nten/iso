import { walk } from "https://deno.land/std/fs/mod.ts";
import { Hono, Context } from "https://deno.land/x/hono/mod.ts";
import { UltraServer } from "https://deno.land/x/ultra@v2.1.5/lib/ultra.ts";
import { hash } from "../iso/utils.ts";
import { UltraAction } from "./createUltraAction.ts";
import { createRouter } from "https://deno.land/x/ultra@v2.1.5/lib/server.ts";

export function customContext(ctx: Context) {
  return ctx;
  // return {
  // 	hono: { ...ctx },
  // 	request: {
  // 		body: ctx.req.body,
  // 		headers: ctx.req.headers,
  // 		queries: ctx.req.queries(),
  // 	},
  // 	response: {
  // 		json: ctx.json,
  // 		status: ctx.status,
  // 		headers: ctx.header,
  // 	},
  // };
}

export type CustomContext = ReturnType<typeof customContext>;

export function buildContext(ctx: Context) {
  return customContext(ctx);
}

export async function importUltraActions(app: UltraServer) {
  const t = new Date().getTime();
  const hono = createRouter()
  for await (const file of walk(Deno.cwd()+"/src", {
    followSymlinks: true,
    includeDirs: false,
  })) {
    if (
      (file.path.endsWith(".ts") ||
      file.path.endsWith(".js") ||
      file.path.endsWith(".tsx") ||
      file.path.endsWith(".jsx") )
    ) {
      if(file.path.endsWith("server.tsx")) continue
      if(file.path.endsWith("client.tsx")) continue
      if(file.path.endsWith("test.ts")) continue
      if(file.path.endsWith("build.ts")) continue
      let imports;
      try {
        imports = await import(file.path);
      } catch {
        // Don't care
      }
      if (!imports) continue
      for (const [key, value] of Object.entries(imports)) {
        if (value instanceof UltraAction) {
          console.log("SERVER", value._fn.toString())
          hono.post(hash(value._fn.toString().replaceAll(/[\r\n]+/g,"").replaceAll(" ","")).toString(), async (ctx) => {
            const input = await ctx.req.json()
            const customContext = buildContext(ctx);
            const returnValue = await value._fn(customContext, input);
            return returnValue;
          });
        }
      }
    }
  }
  app.route("/ultraActions", hono)
  console.log("importUltraActions", new Date().getTime() - t);
  return
}
