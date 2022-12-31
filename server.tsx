import { serve } from "https://deno.land/std@0.164.0/http/server.ts";
import { createServer } from "ultra/server.ts";
import { cleanClientCode, importUltraActions } from "./iso/mod.ts";
import App from "./src/app.tsx";

const server = await createServer({
  importMapPath:
    Deno.env.get("ULTRA_MODE") === "development"
      ? import.meta.resolve("./importMap.dev.json")
      : import.meta.resolve("./importMap.json"),
  browserEntrypoint: import.meta.resolve("./client.tsx"),
  compilerOptions: {
    hooks: {
      beforeTransform: (code, file) => {
        console.log(file.path)
        return cleanClientCode(code, file.path)
      }
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
