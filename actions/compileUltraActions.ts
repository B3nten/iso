import babel from "https://esm.sh/@babel/core";
import generate from "https://esm.sh/@babel/generator";
import babelPresetReact from "https://esm.sh/@babel/preset-react";
import babelPresetTs from "https://esm.sh/@babel/preset-typescript";
import { funcToHash } from "./utils.ts";
import { Visitor } from "https://esm.sh/@swc/core/Visitor";
import {
  NewExpression,
  Expression,
TsType,
} from "https://esm.sh/v102/@swc/core@1.3.24/types";
import { parse, transform } from "https://deno.land/x/swc/mod.ts";

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
        const fn =
          babel.transform(generate(path.node.arguments[0]).code, {
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
    "ms"
  );
  return generate(ast!).code;
}

export function swcCompileUltraActions(
  source: string,
  file: { path: string; extension: string }
) {
  const program = parse(source, {
    target: "es2019",
    syntax: "typescript",
    tsx: file.extension === ".tsx",
    script: true,
  });
  class MyVisitor extends Visitor {
    visitNewExpression(n: NewExpression): Expression {
      if (n.callee.type === "Identifier" && n.callee.value === "UltraAction") {
        if (n.arguments?.[0]) {
          n.arguments[0] = {
            expression: {
              type: "StringLiteral",
              value: "LOL",
              span: n.arguments[0].span,
            }
          }
        }
      }
      return super.visitNewExpression(n);
    }
    visitTsType(n: TsType): TsType {
      return super.visitTsType(n);
    }
  }
  const v = new MyVisitor();
  v.visitProgram(program);
  console.log(transform(program).code)
  return transform(program).code;
}
