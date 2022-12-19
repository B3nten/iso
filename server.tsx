import { serve } from "https://deno.land/std@0.164.0/http/server.ts";
import { createServer } from "ultra/server.ts";
import { testServerFiles } from "./iso/compileServerFiles.ts";
import babel from "https://esm.sh/@babel/core";
import App from "./src/app.tsx";
import generate from "https://esm.sh/@babel/generator";
import { hash } from "./iso/utils.ts";

const server = await createServer({
	importMapPath:
		Deno.env.get("ULTRA_MODE") === "development"
			? import.meta.resolve("./importMap.dev.json")
			: import.meta.resolve("./importMap.json"),
	browserEntrypoint: import.meta.resolve("./client.tsx"),
	compilerOptions: {
		hooks: {
			beforeTransform: (code, file) => {
				if (!file.path.endsWith(".server.ts")) return code;
				const ast = babel.parse(code);
				babel.traverse(ast, {
					enter(path) {
						if (
							path.isCallExpression() &&
							path.node.callee.name === "createLoader"
						) {
							path.replaceWithSourceString(
								`createLoader("/api/${hash(file.path)}/${
									path.parentPath.node.id.name
								}")`
							);
							path.skip();
						} else if (
							path.isCallExpression() &&
							path.node.callee.name === "createAction"
						) {
							path.replaceWithSourceString(
								`createAction("/api/${hash(file.path)}/${
									path.parentPath.node.id.name
								}")`
							);
							// handle imports with pathOrFn
							path.skip();
						}
					},
				});
				return generate(ast!).code;
			},
		},
	},
});

await testServerFiles(server);
console.log(server.routes);

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
