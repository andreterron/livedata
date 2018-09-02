import { Observable, OperatorFunction } from 'rxjs';
import { filter } from 'rxjs/operators';

export function changed<T>(comparator: (a:T, b:T) => boolean = ((a,b) => (a == b))): OperatorFunction<T, T> {
    let value: T;
    return filter((v: T, index: number): boolean => {
        if (index === 0) {
            value = v;
            return true;
        }
        return !comparator(v, value);
    });
}

export interface ILive<T> {
    subscribe(next: (v: T) => void)
    observable: Observable<T>
}

// export interface LiveModel<T> {

// }

export type ILiveNode<T> = {
    (): LiveModel<T>
} & {
    [P in keyof T]: ILiveNode<T>
}

export class LiveModel<T> implements ILive<T> {

    observable: Observable<T>

    value: T;

    constructor(observable: Observable<T>) {
        this.observable = observable.pipe(changed());
    }

    subscribe(...args) {
        return this.observable.subscribe(...args);
    }
}

function liveModel<T = any>(path: PropertyKey[] = []) {
    
}

export function live<T = any>(observable: Observable<T>, path: PropertyKey[] = []): ILiveNode<T> {
    return new Proxy({}, {
        apply: (target: any, thisArg: any, argArray?: any): any => {
            // TODO: construct new Live
            new LiveModel<T>(observable)
        },
        get: (target: T, p: PropertyKey, receiver: any): ILiveNode<any> => {
            return live(observable, path.concat([p]));
        }
    }) as ILiveNode<T>
}