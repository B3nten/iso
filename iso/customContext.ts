import { Context } from "https://deno.land/x/hono/mod.ts";

export function customContext(ctx: Context) {
	return ctx
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