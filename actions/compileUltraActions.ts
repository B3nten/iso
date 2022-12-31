import babel from "https://esm.sh/@babel/core";
import generate from "https://esm.sh/@babel/generator";
import babelPresetReact from "https://esm.sh/@babel/preset-react";
import babelPresetTs from "https://esm.sh/@babel/preset-typescript";
import { funcToHash } from "./utils.ts";



export function compileUltraActions(code: string, filePath: string) {
  if (!code.includes("UltraAction")) return code;
  let ast;
  const fileName = filePath.substring(filePath.lastIndexOf("/") + 1);
  try {
    ast = babel.parse(code, {
      filename: fileName,
      presets: [babelPresetReact, babelPresetTs],
    });
  } catch (e) {
    console.error(e);
    return code;
  }
  babel.traverse(ast, {
    enter(path) {
      // @ts-ignore this is a babel thing
      if (path.isNewExpression() && path.node?.callee?.name === "UltraAction") {
        // const fnStart = path.node.arguments[0].start;
        // const fnEnd = path.node.arguments[0].end;
        // const fn = code.slice(fnStart!, fnEnd!);
        const fn =
          babel.transform(generate(path.node.arguments[0]).code, {
            filename: fileName,
            presets: [babelPresetReact, babelPresetTs],
          })?.code ?? "";

        console.log("babel", fn, filePath);
        path.replaceWithSourceString(`new UltraAction(${funcToHash(fn)})`);
        path.skip();
      }
    },
  });
  return generate(ast!).code;
}
