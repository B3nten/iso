import babel from "https://esm.sh/@babel/core";
import generate from "https://esm.sh/@babel/generator";
import { hash } from "./utils.ts";

const code = `
import {createLoader, createAction} from "https://esm.sh/x";
const loader = createLoader("lol", async (ctx, input) => {
	await prisma.findAll()
})
const loader2 = createLoader(async (ctx, input) => {
	await prisma.findOne()
})
const action = createAction("create-user", async (ctx, { name }) => {console.log("hello")})
`;
export function compile(code: string) {
	let source = code;
	const ast = babel.parse(source);
	babel.traverse(ast, {
		enter(path) {
			if (path.isCallExpression() && path.node.callee.name === "createLoader") {
				const pathOrFn = path.node.arguments[0];
				const fn = path.node.arguments[1];
				path.replaceWithSourceString(
					`createLoader(${fn ? generate(pathOrFn).code : '"' + hash(generate(fn).code) + '"'})`
				);
				// handle imports with pathOrFn
				path.skip();
			}else if(path.isImportDeclaration()){
				console.log(generate(path.node).code)
				console.log(path.node.specifiers.map(s => s.local.name))
			}
		},
	});
	// console.log(source)
	console.log(generate(ast!).code);
}

compile(code);
