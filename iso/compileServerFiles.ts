import { walk } from "https://deno.land/std/fs/mod.ts";
import { Hono, Context } from "https://deno.land/x/hono/mod.ts";
import { hash } from "./utils.ts";

function buildContext(ctx: Context) {
	return ctx;
	return {
		hono: { ...ctx },
		request: {
			body: ctx.req.body,
			headers: ctx.req.headers,
			queries: ctx.req.queries(),
		},
		response: {
			json: ctx.json,
			status: ctx.status,
			headers: ctx.header,
		},
	};
}

async function buildServerFiles() {
	const routes = [];
	for await (const file of walk(Deno.cwd(), {
		followSymlinks: true,
		includeDirs: false,
	})) {
		if (file.path.endsWith("server.ts")) {
			const hono = new Hono();
			const imports = await import(file.path);
			for (const [key, value] of Object.entries(imports)) {
				if (!value || typeof value !== "object" || !("path" in value)) continue;
				if (
					"type" in value &&
					"path" in value &&
					typeof value.path === "function"
				) {
					if (value.type === "loader") {
						hono.get(key, async (ctx: Context) => {
							const input = ctx.req.queries();
							const customContext = buildContext(ctx);
							const returnValue = await value.path(customContext, input);
							return returnValue;
						});
					} else if (value.type === "action") {
						hono.post(key, async (ctx: Context) => {
							const input = ctx.req.json();
							const customContext = buildContext(ctx);
							const returnValue = await value.path(customContext, input);
							return returnValue;
						});
					}
				}
			}
			routes.push({
				hono,
				path: hash(file.path),
			});
		}
	}
	return routes;
}

export async function testServerFiles(app: any) {
	const routes = await buildServerFiles();
	for (const route of routes) {
		app.route("/api/" + route.path, route.hono);
	}
}
