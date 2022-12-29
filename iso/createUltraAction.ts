import type { CustomContext } from "./mod.ts";
import { hash } from "./utils.ts";

type TUltraAction = (ctx: CustomContext, input: Record<string | number, any>) => any;

export class UltraAction {
    _fn: TUltraAction
    constructor(fn: TUltraAction) {
        this._fn = fn
    }

    async run(input: any) {
        let path;
        if(typeof this._fn === "number"){
            path = this._fn
        } else {
            path = hash(this._fn.toString().replaceAll(/[\r\n]+/g,"").replaceAll(" ",""))
        }
        const res = await fetch(`http://localhost:8000/ultraActions/${path}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(input),
        })
        if(!res.ok) {
            throw new Error(res.statusText)
        }
        return res.json()
    }
}