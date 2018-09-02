import { ILiveModel } from "./base";
import { OperatorInput, LiveNode } from "./operators";
import { CurriedInput, CurriedResult, curry } from "./curry";
import { map } from "rxjs/operators";
import { LiveModel } from "./live-model";
import { Subject, Observable, of, combineLatest } from "rxjs";

export interface LiveDataSource<R> {
    ref?: <T>(obj: T) => R

    edge: <C extends CurriedInput<[OperatorInput<K>, OperatorInput<T>]>, K extends keyof T, T = {[k: string]: any}>(...args: C) => CurriedResult<[OperatorInput<K>, OperatorInput<T>], C, ILiveModel<T[K]>>

    node: <T>(liveModel: ILiveModel<T>) => LiveNode<T>
}

export abstract class BaseLiveDataSource<R> implements LiveDataSource<R> {

    // edge: <C extends CurriedInput<[K, OperatorInput<T>]>, K extends keyof T, T = {[k: string]: any}>(...args: C) => CurriedResult<[K, OperatorInput<T>], C, ILiveModel<T[K]>>
    abstract edge: <C extends CurriedInput<[OperatorInput<K>, OperatorInput<T>]>, K extends keyof T, T = {[k: string]: any}>(...args: C) => CurriedResult<[OperatorInput<K>, OperatorInput<T>], C, ILiveModel<T[K]>>

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

export class MemoryDataSource implements LiveDataSource<null> {

    ref: <T>(obj: T) => null

    edge: <C extends CurriedInput<[OperatorInput<K>, OperatorInput<T>]>, K extends keyof T, T = {[k: string]: any}>(...args: C) => CurriedResult<[OperatorInput<K>, OperatorInput<T>], C, ILiveModel<T[K]>> = curry(
        <T, K extends keyof T>(keyInput: OperatorInput<K>, obj: OperatorInput<T>): ILiveModel<T[K]> => {
            let liveObject = LiveModel.of(obj);
            return new LiveModel<T[K]>(combineLatest([of(keyInput), liveObject.observable]).pipe(map(([key, value]: [K, T]): T[K] => {
                // TODO: If array?
                return value[key];
            })));
        }
    ) as <C extends CurriedInput<[OperatorInput<K>, OperatorInput<T>]>, K extends keyof T, T = {[k: string]: any}>(...args: C) => CurriedResult<[OperatorInput<K>, OperatorInput<T>], C, ILiveModel<T[K]>>

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

export class SingleStateDataSource<T> extends BaseLiveDataSource<string[]> {

    public root: ILiveModel<T>

    constructor(state: Observable<T>) {
        super();
        // TODO: get store
        // TODO: subscribe now(?) or maybe when any is subscribed?
        this.root = new LiveModel(state);
    }

    edge: <C extends CurriedInput<[OperatorInput<K>, OperatorInput<T>]>, K extends keyof T, T = {[k: string]: any}>(...args: C) => CurriedResult<[OperatorInput<K>, OperatorInput<T>], C, ILiveModel<T[K]>> = curry(
        <T, K extends keyof T>(keyInput: OperatorInput<K>, obj: OperatorInput<T>): ILiveModel<T[K]> => {
            let liveObject = LiveModel.of(obj);
            return new LiveModel<T[K]>(combineLatest([of(keyInput), liveObject.observable]).pipe(map(([key, value]: [K, T]): T[K] => {
                // TODO: If array?
                if (value === null) return null;
                if (value === undefined) return undefined;
                if (Array.isArray(value)) return null; // TODO: array?
                if (typeof value === "object") {
                    if (key === null || key === undefined) {
                        return key as null | undefined;
                    }
                    return value[key];
                }
                return null;
            })));
        }
    ) as <C extends CurriedInput<[OperatorInput<K>, OperatorInput<T>]>, K extends keyof T, T = {[k: string]: any}>(...args: C) => CurriedResult<[OperatorInput<K>, OperatorInput<T>], C, ILiveModel<T[K]>>
    // edge: <C extends CurriedInput<[K, OperatorInput<T>]>, K extends keyof T, T = {[k: string]: any}>(...args: C) => CurriedResult<[K, OperatorInput<T>], C, ILiveModel<T[K]>> = curry(
    //     <T, K extends keyof T>(key: K, obj: OperatorInput<T>): ILiveModel<T[K]> => {
    //         let liveObject = LiveModel.of(obj);
    //         return new LiveModel<T[K]>(liveObject.observable.pipe(map((value: T): T[K] => {
    //             // TODO: If array?
    //             // let ref = (snap.ref as string[]).concat(key.toString())
    //             if (value === null) return null;
    //             if (value === undefined) return undefined;
    //             if (Array.isArray(value)) return null; // TODO: array?
    //             if (typeof value === "object") return value[key];
    //             return null;
    //         })));
    //     }
    // ) as <C extends CurriedInput<[K, OperatorInput<T>]>, K extends keyof T, T = {[k: string]: any}>(...args: C) => CurriedResult<[K, OperatorInput<T>], C, ILiveModel<T[K]>>

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

export class SerializableDataSource implements LiveDataSource<string> {

    private data: {
        [ref: string]: object
    }

    private subjects: {
        [ref: string]: Subject<any>
    }

    private liveModelCache: {
        [ref: string]: ILiveModel<any>
    }

    constructor(private refKey: string = "__id__") {

    }

    edge: <C extends CurriedInput<[OperatorInput<K>, OperatorInput<T>]>, K extends keyof T, T = {[k: string]: any}>(...args: C) => CurriedResult<[OperatorInput<K>, OperatorInput<T>], C, ILiveModel<T[K]>> = curry(
        <T, K extends keyof T>(keyInput: OperatorInput<K>, obj: OperatorInput<T>): ILiveModel<T[K]> => {
            let liveObject = LiveModel.of(obj);
            return new LiveModel<T[K]>(combineLatest([of(keyInput), liveObject.observable]).pipe(map(([key, value]: [K, T]): T[K] => {
                // TODO: If array?
                if (value === null) return null;
                if (value === undefined) return undefined;
                if (Array.isArray(value)) return null; // TODO: array?
                if (typeof value === "object") return value[key];
                return null;
            })));
        }
    ) as <C extends CurriedInput<[OperatorInput<K>, OperatorInput<T>]>, K extends keyof T, T = {[k: string]: any}>(...args: C) => CurriedResult<[OperatorInput<K>, OperatorInput<T>], C, ILiveModel<T[K]>>

    ref = <T>(obj: T): string => {
        if (obj && typeof obj === "object") {
            return obj[this.refKey];
        }
        return null;
    }

    createRef = (): string => {
        return Math.random().toString(32).substr(2, 9) + Math.random().toString(32).substr(2, 9);
    }

    // edge: <C extends CurriedInput<[K, OperatorInput<T>]>, K extends keyof T, T = {[k: string]: any}>(...args: C) => CurriedResult<[K, OperatorInput<T>], C, ILiveModel<T[K]>> = curry(
    //     <T, K extends keyof T>(key: K, obj: OperatorInput<T>): ILiveModel<T[K]> => {
    //         let liveObject = LiveModel.of(obj);
    //         return new LiveModel<T[K]>(liveObject.observable.pipe(map((value: T): T[K] => {
    //             // let ref = snap[this.refKey] || this.createRef();
    //             // TODO: If array?
    //             // TODO: If object, then switch map to liveObject
    //             return value[key];
    //         })));
    //     }
    // ) as <C extends CurriedInput<[K, OperatorInput<T>]>, K extends keyof T, T = {[k: string]: any}>(...args: C) => CurriedResult<[K, OperatorInput<T>], C, ILiveModel<T[K]>>

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

    private recursiveSet = (obj: any, alertStack: string[]): {original: any, refs: any[]} => {
        let original = {}
        let refs = []
        for (let k in obj) {
            if (typeof obj[k] === "function") {
                continue
            }
            if (typeof obj[k] === "object" && obj[k]) {
                refs.push(obj);
                continue
            }
            original[k] = obj[k]
        }
        return {original, refs};
    }

    set = (ref: string, obj: any): Promise<void> => {
        let stack = []
        let clean = this.recursiveSet(obj, stack);
        this.data[ref] = obj;

        if (this.subjects[ref]) {
            this.subjects[ref].next(obj);
        }
        return Promise.resolve();
    }

    live = <T>(ref: string): ILiveModel<T> => {
        return this.liveModelCache[ref];
    }

}
