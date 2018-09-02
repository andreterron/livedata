import { LiveRef, LiveSnap, ILiveModel, PipeFunction } from "./base";
import { OperatorInput } from "./operators";

export type LiveQuery<T> = {
    [P in keyof T]?: T[P] extends Array<infer A> ? LiveQuery<A> : (T[P] extends object ? LiveQuery<T[P]> : true)
}

export type ActionInput<T> = {
    [P in keyof T]: LiveRef
} // | LiveRef<T>

export type ActionResult<T> = {
    [P in keyof T]: T[P] extends LiveSnap<infer A> ? LiveSnap<A> : never
} // | LiveSnap<T>

export type Action<R, U extends any[]> = (req: ActionResult<R>, ...args: U) => void

export type ActionExec<R, U extends any[]> = (req: ActionInput<R>, ...args: U) => void

export type ActionDefinition = <T, U extends any[]>(query: LiveQuery<T>, action: Action<T, U>) => ActionExec<T, U>

export type DefaultActions = {
    array: {
        // create: (<T>(list: ILiveModel<T[]>, obj: OperatorInput<T>) => Promise<T>) & (<T>(list: ILiveModel<T[]>) => ((obj: OperatorInput<T>) => Promise<T>)),
        // save: (<T>(list: ILiveModel<T[]>, obj: OperatorInput<T>) => Promise<T>) & (<T>(list: ILiveModel<T[]>) => ((obj: OperatorInput<T>) => Promise<T>)),
        add: (<T>(list: ILiveModel<T[]>, obj: OperatorInput<T>) => Promise<T>) & (<T>(list: ILiveModel<T[]>) => ((obj: OperatorInput<T>) => Promise<T>)),
        remove: (<T>(list: ILiveModel<T[]>, obj: OperatorInput<T>) => Promise<T>) & (<T>(list: ILiveModel<T[]>) => ((obj: OperatorInput<T>) => Promise<T>)),
        reorder: (<T>(list: ILiveModel<T[]>, refs: LiveRef[]) => Promise<T>) & (<T>(list: ILiveModel<T[]>) => ((refs: LiveRef[]) => Promise<T>)),
        delete: (<T>(list: ILiveModel<T[]>, obj: OperatorInput<T>) => Promise<T>) & (<T>(list: ILiveModel<T[]>) => ((obj: OperatorInput<T>) => Promise<T>)),
    },
    // number: {
    //     add: 
    // }
}
