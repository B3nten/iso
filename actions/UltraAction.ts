import type { CustomContext } from "./utils.ts";
import { funcToHash } from "./utils.ts";

type Tail<T> = T extends [unknown, ...infer Tail] ? Tail : never;

export class UltraAction<
  Input extends Record<string, unknown>,
  FN extends (ctx: CustomContext, input: Input) => unknown
> {
  _fn: FN;
  constructor(fn: FN) {
    this._fn = fn;
  }
  async fetch(...args: Tail<Parameters<FN>>) {
    let path;
    if (typeof this._fn === "string") {
      path = this._fn;
    } else {
      console.log(typeof Deno !== "undefined" ? "Deno" : "no deno")
      path = funcToHash(this._fn.toString());
    }
    const res = await fetch(`http://localhost:8000/ultraActions/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });
    if (!res.ok) {
      throw new Error(res.statusText);
    }
    return res.json() as ReturnType<FN>;
  }
}
