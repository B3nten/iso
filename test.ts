import babel from "https://esm.sh/@babel/core";
import generate from "https://esm.sh/@babel/generator";
import { hash } from "./iso/utils.ts";

function test(code: string) {
  const ast = babel.parse(code);
  babel.traverse(ast, {
    enter(path) {
      if (path.isNewExpression() && path.node.callee.name === "UltraAction") {
        const fn = path.node.arguments[0];
        const fnString = generate(fn).code;
        const fnHash = hash(fnString);
        path.replaceWithSourceString(`new UltraAction(${fnHash})`);
        path.skip();
      }
    },
  });
  return generate(ast!).code;
}

const source =
  "const getUser = new UltraAction(async (ctx, input) => { return { name: 'John' } })";

console.log(test(source));
