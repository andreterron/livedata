import { WrapLiveObject } from './../base/wrap-live-object';
import { LiveObject } from "../interfaces";

export function createIfNone<T>(create: () => Promise<T>): LiveObject<T> {
    var createPromise: Promise<T>;
    return new WrapLiveObject<T>((setObj, subscriber) => {
        return this.live.first().subscribe((n) => {
            if (!n) {
                if (!createPromise) {
                    createPromise = create();
                }
                createPromise.then((obj) => {
                    this.data = obj;
                    setObj(this)
                }, (e) => {subscriber.error(e)});
            } else {
                subscriber.next(n);
                setObj(this);
            }
        }, (e) => {subscriber.error(e)});
    });
}