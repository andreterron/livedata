import { ILiveModel } from "./base";
import { CurriedFunction2, CurriedFunction3, CurriedFunction4, CurriedFunction5, CurriedFunction6, CurriedInput, CurriedResult, curry } from "./curry";
import { LiveModel } from "./live-model";
import { of, combineLatest, SubscriptionLike, Observable } from "rxjs";
import { map } from "rxjs/operators";


export type OperatorInput<T> = T | Observable<T> | ILiveModel<T>

export type CurriedOperator2<T1, T2, R> = CurriedFunction2<OperatorInput<T1>, OperatorInput<T2>, ILiveModel<R>>
export type CurriedOperator3<T1, T2, T3, R> = CurriedFunction3<OperatorInput<T1>, OperatorInput<T2>, OperatorInput<T3>, ILiveModel<R>>
export type CurriedOperator4<T1, T2, T3, T4, R> = CurriedFunction4<OperatorInput<T1>, OperatorInput<T2>, OperatorInput<T3>, OperatorInput<T4>, ILiveModel<R>>
export type CurriedOperator5<T1, T2, T3, T4, T5, R> = CurriedFunction5<OperatorInput<T1>, OperatorInput<T2>, OperatorInput<T3>, OperatorInput<T4>, OperatorInput<T5>, ILiveModel<R>>
export type CurriedOperator6<T1, T2, T3, T4, T5, T6, R> = CurriedFunction6<OperatorInput<T1>, OperatorInput<T2>, OperatorInput<T3>, OperatorInput<T4>, OperatorInput<T5>, OperatorInput<T6>, ILiveModel<R>>

export type CurriedOperator<U extends OperatorInput<any>[], R> =
    U extends [OperatorInput<infer T1>, OperatorInput<infer T2>] ? CurriedOperator2<T1, T2, R> :
    U extends [OperatorInput<infer T1>, OperatorInput<infer T2>, OperatorInput<infer T3>] ? CurriedOperator3<T1, T2, T3, R> :
    U extends [OperatorInput<infer T1>, OperatorInput<infer T2>, OperatorInput<infer T3>, OperatorInput<infer T4>] ? CurriedOperator4<T1, T2, T3, T4, R> :
    U extends [OperatorInput<infer T1>, OperatorInput<infer T2>, OperatorInput<infer T3>, OperatorInput<infer T4>, OperatorInput<infer T5>] ? CurriedOperator5<T1, T2, T3, T4, T5, R> :
    U extends [OperatorInput<infer T1>, OperatorInput<infer T2>, OperatorInput<infer T3>, OperatorInput<infer T4>, OperatorInput<infer T5>, OperatorInput<infer T6>] ? CurriedOperator6<T1, T2, T3, T4, T5, T6, R> :
    (...args: U) => ILiveModel<R> | CurriedOperator<OperatorInput<any>[], R>;

// export type CurriedOperatorReturn<U extends OperatorInput<any>[], R> = CurriedOperator

export type Curried<F extends Function> = F | F extends (...args: infer U) => ILiveModel<infer R> ? CurriedOperator<U, R> : never;

// export type OperatorGroup = {
//     [key: string]
// }

// export type LiveOperator

// export type LiveOperator<R, U extends any[]> =

// --------------------------------

export interface Operators {
    bool: {
        and: CurriedOperator2<boolean, boolean, boolean>
        or: CurriedOperator2<boolean, boolean, boolean>
    },
    create: <T>(input: OperatorInput<T>) => LiveModel<T>
    // edge: (<T, K extends keyof T>(field: K, obj: ILiveModel<T>) => CurriedOperatorReturn<[K, T], T[K]>) | (<T, K extends keyof T>(field: K) => ((obj: OperatorInput<T>) => ILiveModel<T[K]>))
    // edge: Curried<(<R, K extends keyof R>(key: K, obj: OperatorInput<R>) => ILiveModel<R[K]>)>
    // edge: (<R, K extends keyof R>(key: K, obj: OperatorInput<R>) => ILiveModel<R[K]>) & (<T, K extends keyof T>(key: K) => PipeFunction<T, T[K]>)
    edge: <C extends CurriedInput<[K, OperatorInput<T>]>, K extends keyof T, T = {[k: string]: any}>(...args: C) => CurriedResult<[K, OperatorInput<T>], C, ILiveModel<T[K]>>
    node: <T>(liveModel: ILiveModel<T>) => LiveNode<T>
};


export type Live<T> = T extends Array<infer A> ? {
    $: ILiveModel<Array<ILiveModel<A>>>
} : {
    $: ILiveModel<T>
}

// TODO: lets remove this array BS
export type LiveNode<T> = T extends null ? Live<T> & {[P in keyof T]: LiveNode<T>} : T extends object ? (T extends Array<infer A> ? Live<T> & {
    [P in keyof A]: A[P] extends Array<infer B> ? LiveNode<Array<B>> : (A[P] extends object ? LiveNode<Array<A[P]>> : Live<Array<A[P]>>)
} : Live<T> & {
    [P in keyof T]: T[P] extends object ? LiveNode<T[P]> : Live<T[P]>
}) : Live<T>

export class DefaultOperators implements Operators {
    bool = {
        and: curry((a: OperatorInput<boolean>, b: OperatorInput<boolean>): ILiveModel<boolean> => new BooleanLiveOperator('and', this.create(a), this.create(b))),
        or: curry((a: OperatorInput<boolean>, b: OperatorInput<boolean>): ILiveModel<boolean> => new BooleanLiveOperator('or', this.create(a), this.create(b))),
    }

    isLiveModel = <T>(input: OperatorInput<T>): input is LiveModel<T> => {
        return !!input && typeof input === 'object' && input['observable'] && typeof input['subscribe'] === 'function' && typeof input['pipe'] === 'function';
    }

    create = <T>(input: OperatorInput<T>): LiveModel<T> => {
        return LiveModel.of(input);
    }

    edge: <C extends CurriedInput<[K, OperatorInput<T>]>, K extends keyof T, T = {[k: string]: any}>(...args: C) => CurriedResult<[K, OperatorInput<T>], C, ILiveModel<T[K]>> = curry(
        <T, K extends keyof T>(key: K, obj: OperatorInput<T>): ILiveModel<T[K]> => {
            let liveObject = this.create(obj);
            return new LiveModel<T[K]>(liveObject.observable.pipe(map((value: T): T[K] => {
                // TODO: If array?
                return value[key];
            })));
        }
    ) as <C extends CurriedInput<[K, OperatorInput<T>]>, K extends keyof T, T = {[k: string]: any}>(...args: C) => CurriedResult<[K, OperatorInput<T>], C, ILiveModel<T[K]>>

    // TODO: I don't like this function inside the Operators
    node = <T>(liveModel: ILiveModel<T>): LiveNode<T> => {
        return new Proxy({}, {
            get: <K extends keyof T>(target: any, p: K, receiver: any): ILiveModel<T> | LiveNode<T[K]> => {
                if (p === "$") {
                    return liveModel;
                }
                return this.node<T[K]>(this.edge<[K, ILiveModel<T>], K, T>(p, liveModel))
            }
        }) as LiveNode<T>;
    }
}

export class BooleanLiveOperator extends LiveModel<boolean> {
    constructor(operation: 'and' | 'or', liveA: ILiveModel<boolean>, liveB: ILiveModel<boolean>) {
        super(new Observable((subscriber) => {
            let params = combineLatest(liveA.observable, liveB.observable)
            let currentSubscription: SubscriptionLike = null;
            const all = () => {
                if (currentSubscription) {
                    currentSubscription.unsubscribe();
                }
                currentSubscription = params.subscribe(([a, b]) => {
                    if (operation === 'and') {
                        subscriber.next(a && b);
                        if (a === false) {
                            block(liveA, false);
                        } else if (b === false) {
                            block(liveB, false);
                        }
                    } else if (operation === 'or') {
                        subscriber.next(a || b);
                        if (a === true) {
                            block(liveA, true);
                        } else if (b === true) {
                            block(liveB, true);
                        }
                    }
                }, err => subscriber.error(err));
            }
            const block = (toBlock: ILiveModel<boolean>, value: boolean) => {
                let blockSubscription = toBlock.observable.subscribe(a => {
                    if (a !== value) {
                        all();
                    }
                });
                if (currentSubscription) {
                    currentSubscription.unsubscribe();
                }
                currentSubscription = blockSubscription;
            }

            all();

            return () => {
                if (currentSubscription) {
                    currentSubscription.unsubscribe()
                }
            };
        }));
    }
}

// type Car = {
//     motor: string, year: number, model: string
// }

// let op: Operators;



// let car: ILiveModel<Car>;

// car.pipe(op.edge('year')).subscribe((next: LiveSnap<number>) => {console.log(next)});

// // op.edge('year', car)

// // let e = op.edge<Car, 'year'>('year')
// // e<Car>(car)


// let and: CurriedOperator2<boolean, boolean, boolean>;
// let or: CurriedOperator2<boolean, boolean, boolean>;

// let a: ILiveModel<boolean>, b: ILiveModel<boolean>, c: ILiveModel<boolean>;

// // b.pipe(and(a)).pipe(and(c))

// // c.pipe(or(a, b))

// // or(a, b, c).pipe(and(c))

// // and(or(a, b, c), c)

// // or(a, b).add(c)

// and(a)(b).pipe(and(c))
// and(a, b).pipe(and(c));
// a.pipe(and(b)).pipe(and(c));
// a.pipe(and(and(b, c)));



