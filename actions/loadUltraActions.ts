import { walk } from "https://deno.land/std/fs/mod.ts";
import { UltraServer } from "https://deno.land/x/ultra@v2.1.5/lib/ultra.ts";
import { UltraAction } from "./UltraAction.ts";
import { createRouter } from "https://deno.land/x/ultra@v2.1.5/lib/server.ts";
import { buildCustomContext, funcToHash } from "./utils.ts";

export async function loadUltraActions(app: UltraServer) {
  const t = new Date().getTime();
  const hono = createRouter();
  for await (
    const file of walk(Deno.cwd() + "/src", {
      followSymlinks: true,
      includeDirs: false,
    })
  ) {
    if (
      file.path.endsWith(".ts") ||
      file.path.endsWith(".js") ||
      file.path.endsWith(".tsx") ||
      file.path.endsWith(".jsx")
    ) {
      if (file.path.endsWith("server.tsx")) continue;
      if (file.path.endsWith("client.tsx")) continue;
      if (file.path.endsWith("test.ts")) continue;
      if (file.path.endsWith("build.ts")) continue;
      let imports;
      try {
        imports = await import(file.path);
      } catch {
        // Don't care
      }
      if (!imports) continue;
      for (const [_, value] of Object.entries(imports)) {
        if (!(value instanceof UltraAction)) continue;
        hono.post(funcToHash(value._fn.toString()), async (ctx) => {
          const [input] = (await ctx.req.json()) as Array<
            Record<string, unknown>
          >;
          console.log("Ultra Action called", input);
          // @ts-ignore Todo: fix this
          const customContext = buildCustomContext(ctx);
          let returnValue;
          try {
            const res = await value._fn(customContext, input);
            returnValue = res;
          } catch (e) {
            returnValue = ctx.json({ error: e.message }, 500);
          }
          return returnValue;
        });
      }
    }
  }
  app.route("/ultraActions", hono);
  console.log("Ultra Actions imported in", new Date().getTime() - t, "ms");
  return;
}
