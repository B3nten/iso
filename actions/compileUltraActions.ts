import babel from "https://esm.sh/@babel/core";
import generate from "https://esm.sh/@babel/generator";
import babelPresetReact from "https://esm.sh/@babel/preset-react";
import babelPresetTs from "https://esm.sh/@babel/preset-typescript";
import { funcToHash } from "./utils.ts";

export function compileUltraActions(code: string, filePath: string) {
  if (!code.includes("UltraAction")) return code;
  const startTime = new Date().getTime();
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
        const fn = babel.transform(generate(path.node.arguments[0]).code, {
          filename: fileName,
          presets: [babelPresetReact, babelPresetTs],
        })?.code ?? "";
        path.replaceWithSourceString(`new UltraAction(${funcToHash(fn)})`);
        path.skip();
      }
    },
  });
  console.log(
    "Ultra Action compiled in",
    new Date().getTime() - startTime,
    "ms",
  );
  return generate(ast!).code;
}
