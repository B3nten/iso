import { createLoader } from "../iso/createLoader.ts"

export const getHomeData = createLoader(async (ctx, { name }) => {
	await new Promise((resolve) => setTimeout(resolve, 1000));
	return ctx.json({ message: "Hello world! From "});
});
