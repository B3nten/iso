import type { CustomContext } from "./customContext.ts"

export function createLoader(fn: (ctx: CustomContext, input?: Record<string|number, any>) => JSON) {
	return {path: fn, type: "loader"}
}

/* 

returns and object with the type of loader and the loader function itself

however on the client, the loader function is not the same as the server loader function

we replace the loader function with a fetch function

*/