import { walk } from "https://deno.land/std/fs/mod.ts";
import { UltraServer } from "https://deno.land/x/ultra@v2.1.5/lib/ultra.ts";
import { UltraAction } from "./createUltraAction.ts";
import { createRouter } from "https://deno.land/x/ultra@v2.1.5/lib/server.ts";
import babel from "https://esm.sh/@babel/core";
import generate from "https://esm.sh/@babel/generator";
import babelPresetReact from "https://esm.sh/@babel/preset-react";
import babelPresetTs from "https://esm.sh/@babel/preset-typescript";
import { funcToHash, buildCustomContext } from "./utils.ts";

export async function importUltraActions(app: UltraServer) {
  const t = new Date().getTime();
  const hono = createRouter();
  for await (const file of walk(Deno.cwd() + "/src", {
    followSymlinks: true,
    includeDirs: false,
  })) {
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
        console.log("import", value._fn.toString(), file.path);
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

export function cleanClientCode(code: string, filePath: string) {
  if (!code.includes("UltraAction")) return code;
  let ast;
  const fileName = filePath.substring(filePath.lastIndexOf("/") + 1);
  try {
    ast = babel.parse(code, {
      filename: fileName,
      presets: [babelPresetReact, babelPresetTs],
    });
  } catch (e) {
    console.error(e);
    return code;
  }
  babel.traverse(ast, {
    enter(path) {
      // @ts-ignore this is a babel thing
      if (path.isNewExpression() && path.node?.callee?.name === "UltraAction") {
        // const fnStart = path.node.arguments[0].start;
        // const fnEnd = path.node.arguments[0].end;
        // const fn = code.slice(fnStart!, fnEnd!);
        const fn =
          babel.transform(generate(path.node.arguments[0]).code, {
            filename: fileName,
            presets: [babelPresetReact, babelPresetTs],
          })?.code ?? "";

        console.log("babel", fn, filePath);
        path.replaceWithSourceString(`new UltraAction(${funcToHash(fn)})`);
        path.skip();
      }
    },
  });
  return generate(ast!).code;
}
