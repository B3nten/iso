import { serve } from "https://deno.land/std@0.164.0/http/server.ts";
import { createServer } from "https://raw.githubusercontent.com/B3nten/ultra/jit/server.ts";
import App from "./src/app.tsx";
import { compileUltraActions, loadUltraActions } from "ultra/actions";

const server = await createServer({
  importMapPath: import.meta.resolve("./importMap.json"),
  browserEntrypoint: import.meta.resolve("./client.tsx"),
  //@ts-ignore ultra error
  compilerOptions: {
    hooks: {
      beforeTransform: (code, file) => {
        return compileUltraActions(code, file.path);
      },
    },
  },
  mode: "development"
});

await loadUltraActions(server);

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
