import { PartialObserver, SubscriptionLike, Observable } from "rxjs";


export type LiveRef = { // TODO: What's the ref?
    ref: any
}

export type LiveSnap<R> = LiveRef & { // TODO: What's the ref?
    value: R
}

export type PipeFunction<T, R> = (source: ILiveModel<T>) => ILiveModel<R>

export interface ILiveModel<T> {

    observable: Observable<T>


    // Pipe
    pipe<A>(op1: PipeFunction<T, A>): ILiveModel<A>
    pipe<A, B>(op1: PipeFunction<T, A>, op2: PipeFunction<A, B>): ILiveModel<B>;
    pipe<A, B, C>(op1: PipeFunction<T, A>, op2: PipeFunction<A, B>, op3: PipeFunction<B, C>): ILiveModel<C>;
    pipe<A, B, C, D>(op1: PipeFunction<T, A>, op2: PipeFunction<A, B>, op3: PipeFunction<B, C>, op4: PipeFunction<C, D>): ILiveModel<D>;
    pipe<A, B, C, D, E>(op1: PipeFunction<T, A>, op2: PipeFunction<A, B>, op3: PipeFunction<B, C>, op4: PipeFunction<C, D>, op5: PipeFunction<D, E>): ILiveModel<E>;
    pipe<A, B, C, D, E, F>(op1: PipeFunction<T, A>, op2: PipeFunction<A, B>, op3: PipeFunction<B, C>, op4: PipeFunction<C, D>, op5: PipeFunction<D, E>, op6: PipeFunction<E, F>): ILiveModel<F>;
    pipe<A, B, C, D, E, F, G>(op1: PipeFunction<T, A>, op2: PipeFunction<A, B>, op3: PipeFunction<B, C>, op4: PipeFunction<C, D>, op5: PipeFunction<D, E>, op6: PipeFunction<E, F>, op7: PipeFunction<F, G>): ILiveModel<G>;
    pipe<A, B, C, D, E, F, G, H>(op1: PipeFunction<T, A>, op2: PipeFunction<A, B>, op3: PipeFunction<B, C>, op4: PipeFunction<C, D>, op5: PipeFunction<D, E>, op6: PipeFunction<E, F>, op7: PipeFunction<F, G>, op8: PipeFunction<G, H>): ILiveModel<H>;
    pipe<A, B, C, D, E, F, G, H, I>(op1: PipeFunction<T, A>, op2: PipeFunction<A, B>, op3: PipeFunction<B, C>, op4: PipeFunction<C, D>, op5: PipeFunction<D, E>, op6: PipeFunction<E, F>, op7: PipeFunction<F, G>, op8: PipeFunction<G, H>, op9: PipeFunction<H, I>): ILiveModel<I>;
    pipe<R>(...operations: PipeFunction<any, any>[]): ILiveModel<R>;

    // Subscribe
    subscribe(observer?: PartialObserver<T>): SubscriptionLike;
    subscribe(next?: (value: T) => void, error?: (error: any) => void, complete?: () => void): SubscriptionLike;
}

// export class LiveModel<T> implements ILiveModel<T> {

//     observable: Observable<LiveSnap<T>>

//     constructor(observable: Observable<T>) {
//         this.observable = new Observable<T>((subscriber) => {
//             return observable.subscribe(subscriber);
//         })
//     }
// }

// let obs: Observable<string>

// obs.forEach

// Graph Navigation


// type LiveArray<T> = {
//     [P in keyof T]: T[P] extends Array<infer A> ? LiveArray<A> : (T[P] extends object ? LiveArray<T[P]> : ILive<Array<T[P]>>)
// } & ILive<Array<T>> & {
    
// }

// type LiveFn<T> = {
//     // [P in keyof T]: <A>() => (T[P] extends Array<A> ? LiveArray<LiveFn<A>> : (T[P] extends object ? LiveFn<T[P]> : LiveLiteral))
//     [P in keyof T]: T[P] extends Array<infer A> ? LiveArray<A> : (T[P] extends object ? LiveFn<T[P]> : ILive<T[P]>)
// } & ILive<T>
