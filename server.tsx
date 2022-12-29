import { serve } from "https://deno.land/std@0.164.0/http/server.ts";
import { createServer } from "ultra/server.ts";
import { importUltraActions } from "./iso/mod.ts";
import App from "./src/app.tsx";
import babel from "https://esm.sh/@babel/core";
import generate from "https://esm.sh/@babel/generator";
import babelPresetReact from "https://esm.sh/@babel/preset-react";
import babelPresetTs from "https://esm.sh/@babel/preset-typescript";
import { hash } from "./iso/utils.ts";

const server = await createServer({
  importMapPath:
    Deno.env.get("ULTRA_MODE") === "development"
      ? import.meta.resolve("./importMap.dev.json")
      : import.meta.resolve("./importMap.json"),
  browserEntrypoint: import.meta.resolve("./client.tsx"),
  compilerOptions: {
    hooks: {
      beforeTransform: (code) => {
        if (!code.includes("UltraAction")) return code;
        let ast
        try {
          ast = babel.parse(code, { presets: [babelPresetReact] });
        } catch {
          return code
        }
        babel.traverse(ast, {
          enter(path) {
            if (
              path.isNewExpression() &&
              path.node?.callee?.name === "UltraAction"
            ) {
              const fnStart = path.node.arguments[0].start
              const fnEnd = path.node.arguments[0].end
              const fn = code.slice(fnStart!, fnEnd!)
              console.log("BABEL", fn)
              const fnHash = hash(fn.replaceAll(/[\r\n]+/g,"").replaceAll(" ",""));
              path.replaceWithSourceString(`new UltraAction(${fnHash})`);
              path.skip();
            }
          },
        });
        return generate(ast).code;
      },
    },
  },
});

await importUltraActions(server);
console.log(server.routes)

server.get("*", async (context) => {
  /**
   * Render the request
   */
  const result = await server.render(<App />);

  return context.body(result, 200, {
    "content-type": "text/html; charset=utf-8",
  });
});

if (import.meta.main) {
  serve(server.fetch);
}

export default server;
