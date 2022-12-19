import type { CustomContext } from "./customContext.ts"

export function createLoader(fn: (ctx: CustomContext, input?: any) => Promise<Response>) {
	return {path: fn, type: "loader"}
}