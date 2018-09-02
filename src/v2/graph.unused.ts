import { ILiveModel, PipeFunction } from "./base";

// type LiveArray<T> = {
//     [P in keyof T]: T[P] extends Array<infer A> ? LiveArray<A> : (T[P] extends object ? LiveArray<T[P]> : ILive<Array<T[P]>>)
// } & ILive<Array<T>> & {
    
// }

// type LiveFn<T> = {
//     // [P in keyof T]: <A>() => (T[P] extends Array<A> ? LiveArray<LiveFn<A>> : (T[P] extends object ? LiveFn<T[P]> : LiveLiteral))
//     [P in keyof T]: T[P] extends Array<infer A> ? LiveArray<A> : (T[P] extends object ? LiveFn<T[P]> : ILive<T[P]>)
// } & ILive<T>

type Live<T> = T extends Array<infer A> ? {
    $: ILiveModel<Array<ILiveModel<A>>>
} : {
    $: ILiveModel<T>
}

type LiveNode<T> = T extends object ? (T extends Array<infer A> ? Live<T> & {
    [P in keyof A]: A[P] extends Array<infer B> ? LiveNode<Array<B>> : (A[P] extends object ? LiveNode<Array<A[P]>> : Live<Array<A[P]>>)
} : Live<T> & {
    [P in keyof T]: T[P] extends object ? LiveNode<T[P]> : Live<T[P]>
}) : Live<T>

// export function graph<T>(liveModel: ILiveModel<T>): LiveNode<T> {
//     return new Proxy({}, {
//         get: <K extends keyof T>(target: any, p: K, receiver: any): LiveNode<T[K]> => {
//             // return graph<T[K]>(liveModel.pipe(edge(p)))
//         }
//     }) as LiveNode<T>; // TODO: implement
// }

// export function edge<T, K extends keyof T>(string: K): PipeFunction<T, T[K]> {

//     return null; // TODO: implement
//     // how would I usually traverse the edge?
//     // should this function be passed?
//     // action dispatcher?
//     // data manager?
    
// }
