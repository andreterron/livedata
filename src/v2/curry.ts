export interface CurriedFunction2<T1, T2, R> {
    (t1: T1): (t2: T2) => R;
    (t1: T1, t2: T2): R;
}

export interface CurriedFunction3<T1, T2, T3, R> {
    (t1: T1): CurriedFunction2<T2, T3, R>;
    (t1: T1, t2: T2): (t3: T3) => R;
    (t1: T1, t2: T2, t3: T3): R;
}

export interface CurriedFunction4<T1, T2, T3, T4, R> {
    (t1: T1): CurriedFunction3<T2, T3, T4, R>;
    (t1: T1, t2: T2): CurriedFunction2<T3, T4, R>;
    (t1: T1, t2: T2, t3: T3): (t4: T4) => R;
    (t1: T1, t2: T2, t3: T3, t4: T4): R;
}

export interface CurriedFunction5<T1, T2, T3, T4, T5, R> {
    (t1: T1): CurriedFunction4<T2, T3, T4, T5, R>;
    (t1: T1, t2: T2): CurriedFunction3<T3, T4, T5, R>;
    (t1: T1, t2: T2, t3: T3): CurriedFunction2<T4, T5, R>;
    (t1: T1, t2: T2, t3: T3, t4: T4): (t5: T5) => R;
    (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5): R;
}

export interface CurriedFunction6<T1, T2, T3, T4, T5, T6, R> {
    (t1: T1): CurriedFunction5<T2, T3, T4, T5, T6, R>;
    (t1: T1, t2: T2): CurriedFunction4<T3, T4, T5, T6, R>;
    (t1: T1, t2: T2, t3: T3): CurriedFunction3<T4, T5, T6, R>;
    (t1: T1, t2: T2, t3: T3, t4: T4): CurriedFunction2<T5, T6, R>;
    (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5): (t6: T6) => R;
    (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6): R;
}

export type CurriedFunction<U extends any[], R> =
    U extends [infer T1, infer T2] ? CurriedFunction2<T1, T2, R> :
    U extends [infer T1, infer T2, infer T3] ? CurriedFunction3<T1, T2, T3, R> :
    U extends [infer T1, infer T2, infer T3, infer T4] ? CurriedFunction4<T1, T2, T3, T4, R> :
    U extends [infer T1, infer T2, infer T3, infer T4, infer T5] ? CurriedFunction5<T1, T2, T3, T4, T5, R> :
    U extends [infer T1, infer T2, infer T3, infer T4, infer T5, infer T6] ? CurriedFunction6<T1, T2, T3, T4, T5, T6, R> :
    (...args: U) => R | CurriedFunction<any[], R>;

export type CurriedInput<U extends any[]> =
    U extends [] ? never :
    U extends [any] ? never :
    U extends [infer T1, infer T2] ? ([T1, T2] | [T1]) :
    any[]



export type CurriedResult<I extends any[], U extends CurriedInput<I>, R> =
    I extends [infer T1, infer T2] ?
        U extends [T1] ? (t: T2) => R : R
    : I extends [infer T1, infer T2, infer T3] ?
        U extends [T1] ? CurriedFunction2<T2, T3, R> :
        U extends [T1, T2] ? (t: T3) => R : R
    : I extends [infer T1, infer T2, infer T3, infer T4] ?
        U extends [T1] ? CurriedFunction3<T2, T3, T4, R> :
        U extends [T1, T2] ? CurriedFunction2<T3, T4, R> :
        U extends [T1, T2, T3] ? (t: T4) => R : R
    : I extends [infer T1, infer T2, infer T3, infer T4, infer T5] ?
        U extends [T1] ? CurriedFunction4<T2, T3, T4, T5, R> :
        U extends [T1, T2] ? CurriedFunction3<T3, T4, T5, R> :
        U extends [T1, T2, T3] ? CurriedFunction2<T4, T5, R> :
        U extends [T1, T2, T3, T4] ? (t: T5) => R : R
    : I extends [infer T1, infer T2, infer T3, infer T4, infer T5, infer T6] ?
        U extends [T1] ? CurriedFunction5<T2, T3, T4, T5, T6, R> :
        U extends [T1, T2] ? CurriedFunction4<T3, T4, T5, T6, R> :
        U extends [T1, T2, T3] ? CurriedFunction3<T4, T5, T6, R> :
        U extends [T1, T2, T3, T4] ? CurriedFunction2<T5, T6, R> :
        U extends [T1, T2, T3, T4, T5] ? (t: T6) => R : R
    : CurriedFunction<any[], R> | R

// ALERT: this removes function.length parameter
export const curry = <U extends any[], R>(fn: (...args: U) => R, passedArgs: any[] = []): CurriedFunction<U, R> => {
    let curried = ((...args: any[]): R | CurriedFunction<any[], R> => {
        if (passedArgs.length + args.length >= fn.length) {
            return fn(...(passedArgs.concat(...args)) as U);
        }
        return curry(fn, passedArgs.concat([...args]));
    }) as CurriedFunction<U, R>;
    return curried;
}

// type Edge<T, K extends keyof T> = <C extends CurriedInput<[K, OperatorInput<T>]>>(...args: C) => CurriedResult<[K, OperatorInput<T>], C, T[K]>;

// let edge: <T, K extends keyof T, C extends CurriedInput<[K, OperatorInput<T>]>>(...args: C) => CurriedResult<[K, OperatorInput<T>], C, T[K]>;
// let e: Edge<Car, "year">


// type Car = {
//     year: number,
//     model: string
// }

// let str: string, num: number;
// let car: Car = {year: 2018, model: "teslaa"}

// let a = e("year")
// let e2 = edge<Car, "year", ["year"]>("year")
// let e2: <T>(CurriedFunction2<T, number, number>)
