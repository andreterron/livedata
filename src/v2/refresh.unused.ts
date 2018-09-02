import { BehaviorSubject, Observable, AsyncSubject, Subject, Subscriber } from "rxjs";
import { LiveModel } from "./live-model";
import { PipeFunction, ILiveModel, LiveSnap } from "./base";

// TODO: decouple refresh logic from the actual LiveModel class

// export const refreshable = <T>(refresh: () => Promise<T>): RefreshableLiveModel<T> => {
//     return new RefreshableLiveModel<T>(refresh);
// }

// export class RefreshableLiveModel<T> extends LiveModel<T> {

//     private _refresh: () => Promise<T>;
//     private behavior: Subject<LiveSnap<T>> = new Subject<LiveSnap<T>>();

//     constructor(refresh: () => Promise<T>) {
//         super(new Observable<LiveSnap<T>>((subscriber: Subscriber<LiveSnap<T>>) => {
//             this.behavior.asObservable().subscribe(subscriber);
//             this._refresh();
//         }))
//         this._refresh = refresh;
//     }

//     // refresh(): Promise<LiveSnap<T>> {
//     //     return this._refresh().then((value: T) => {
//     //         let snap = {
//     //             ref: this.ref,
//     //             value: value
//     //         };
//     //         this.behavior.next(snap);
//     //         return snap;
//     //     }, (err) => {
//     //         this.behavior.error(err);
//     //         throw err;
//     //     });
//     // }

//     pipe<R>(...args: PipeFunction<any, any>[]): RefreshableLiveModel<R> {
//         let res: ILiveModel<any> = this;
//         for (let pipeFn of args) {
//             res = pipeFn(res);
//         }
//         return res as RefreshableLiveModel<R>;
//     }
// }