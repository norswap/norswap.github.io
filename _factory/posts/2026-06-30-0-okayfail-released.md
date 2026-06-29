---
layout: brief
title: "Okayfail Library Released"
---

I'm dropping [a little library called "okayfail"][okayfail] implementing a `Result<Value, Error>` type for TypeScript.
(Like the Rust Result type, or the NeverThrow TypeScript library.)

[okayfail]: https://github.com/norswap/evmetal/tree/master/pkgs/okayfail

My favorite feature is the ability to do checked/typed exceptions via generators:

 ```typescript
declare const numberResult: Result<number, Error>
declare function fNumberResult(): Result<number, string>
declare const shouldSum: boolean

const foo: () => Result<number, Error | string> =
    fresult(function *() {
        const v1 = yield* numberResult
        // v1 is type `number`
        // if the result fails, foo returns it immediately
        const v2 = yield* fNumberResult()
        // same            
        return shouldSum ? v1 + v2 : okay(v1 - v2)
        // can return either values or results,
        // or a mix (the value types must match!)
    })
 ```

[Check out the code & docs here.][okayfail]