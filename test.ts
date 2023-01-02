import { z } from "https://deno.land/x/zod/mod.ts";

export class UltraAction<CB extends (ctx: any, input: any) => any> {
  private _fn: any;
  private _input: any;

  constructor(callback?: CB) {
    this._fn = callback;
  }

  fetch(input: Parameters<CB>[1] extends undefined ? void : Parameters<CB>[1]): ReturnType<CB> {
    console.log(input);
    return null as unknown as ReturnType<CB>;
  }

  input<T>(zFunc: (zod: typeof z) => z.ZodType<T>) {
    this._input = zFunc;
    return {
      output: (
        callback: (ctx: any, input: z.infer<ReturnType<typeof zFunc>>) => any
      ) => {
        this._fn = callback;
        return {
          fetch: (
            input: z.infer<ReturnType<typeof zFunc>>
          ): ReturnType<typeof callback> => {
            console.log("fetching " + input);
            return null as unknown as ReturnType<typeof callback>;
          },
        };
      },
    };
  }
  output<T extends (ctx: any, input: any) => any>(callback: T) {
    this._fn = callback;
    return {
      fetch: (input: Parameters<T>[1]): ReturnType<T> => {
        console.log("fetching " + input);
        return null as unknown as ReturnType<T>;
      },
    };
  }
}

export const getUsers = new UltraAction()
  .input((z) => z.object({ id: z.string() }))
  .output((ctx, input) => {
    return ctx.ok({ id: input.id });
  });

