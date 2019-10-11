import { LiveDataObservable } from "./live-data-observable";
import { LiveList, LiveObject } from "../interfaces";
import { WrapLiveModel } from "./wrap-live-model";
import { Subscription, TeardownLogic, AnonymousSubscription } from "rxjs/Subscription";
import { Subscriber } from "rxjs/Subscriber";
import { Subscribable, Observable } from "rxjs/Observable";
import { RelationInput } from "../interfaces/relations.interface";


export class WrapLiveObject<T> extends WrapLiveModel<T, T, LiveObject<T>> implements LiveObject<T> {

    subscribeToChild(): TeardownLogic[] {
        return [this.child.subscribe((n) => this.alert(n), (err) => this.alertError(err))];
    }

    refresh(): Promise<T> {
        if (this.child) {
            return this.child.refresh();
        }
        return this.waitForChild().then(() => this.child.refresh());
    }
    save(obj?: T, options?: any): Promise<any> {
        if (this.child) {
            return this.child.save(obj, options);
        }
        return this.waitForChild().then(() => this.child.save(obj, options));
    }
    delete(options?: any): Promise<any> {
        if (this.child) {
            return this.child.delete(options);
        }
        return this.waitForChild().then(() => this.child.delete(options));
    }
    toMany<R>(relation: RelationInput, options?: any): LiveList<R> {
        console.log('TO MANY', relation);
        return new WrapLiveList<R>((setList, subscriber: Subscriber<any>): TeardownLogic => {
            return this.childObservable.subscribe(() => {
                try {
                    if (this.child) {
                        setList(this.child.toMany(relation, options));
                    } else {
                        console.error('TO MANY - no child after child observable');
                        subscriber.next([]);
                    }
                } catch (e) {
                    console.error('TO MANY - sub error', e);
                    subscriber.error(e)
                }
            }, (e) => {console.error('TO MANY - error', e);subscriber.error(e)}, () => {subscriber.complete()});
        }, this.depth + 1)
    }
    toOne<R>(relation: string, options?: any): LiveObject<R> {
        return new WrapLiveObject<R>((setObj, subscriber) => {
            return this.childObservable.subscribe(() => {
                try {
                    if (this.child) {
                        setObj(this.child.toOne(relation, options));
                    } else {
                        console.error('no child after child observable');
                        subscriber.next(null);
                    }
                } catch (e) {
                    subscriber.error(e)
                }
            }, (e) => {subscriber.error(e)}, () => {subscriber.complete()});
        }, this.depth + 1);
    }

    createIfNone(create: () => Promise<T>): LiveObject<T> {
        return new WrapLiveObject<T>((setChild, subscriber) => {
            return this.childObservable.subscribe(() => {
                try {
                    if (this.child) {
                        setChild(this.child.createIfNone(create));
                    }
                } catch (e) {
                    subscriber.error(e)
                }
            }, (e) => {subscriber.error(e)}, () => {subscriber.complete()});
        }, this.depth + 1);
    }

}

export class WrapLiveList<T> extends WrapLiveModel<T[], T, LiveList<T>> implements LiveList<T> {

    liveObjects: Subscribable<LiveObject<T>[]> = this.childObservable.switchMap(() => {
        if (this.child) {
            return this.child.liveObjects;
        } else {
            return new Observable((sub) => {
                sub.next([]);
                sub.complete();
            });
        }
    });

    subscribeToChild(): TeardownLogic[] {
        return [this.child.subscribe((n) => this.alert(n), (err) => this.alertError(err))];
    }

    refresh(): Promise<T[]> {
        if (this.child) {
            return this.child.refresh();
        }
        return this.waitForChild().then(() => this.child.refresh());
    }

    create(data: any, extra?: any, options?: any): Promise<T> {
        if (this.child) {
            return this.child.create(data, extra, options);
        }
        return this.waitForChild().then(() => this.child.create(data, extra, options));
    }
    add(obj: T, extra?: any, options?: any): Promise<any> {
        if (this.child) {
            console.log('WRAP ADD', this.depth, obj);
            return this.child.add(obj, extra, options);
        }
        var hasChild = false;
        console.log('WRAP ADD (waiting)', this.depth, obj);
        let p = this.waitForChild().then(() => {
            hasChild = true;
            console.log('GOT WAITING CHILD!', this.depth, obj)
            return this.child.add(obj, extra, options)
        }, (e) => {
            console.error('GOT ERROR ON CHILD', this.depth, e);
            throw e;
        });
        console.log('set timeout', this.depth);
        setTimeout(() => {
            if (!hasChild && this.child) {
                console.error('WE GOT A CHILD, BUT THE PROMISE DIDNT RESOLVE!!!!');
            } else {
                console.warn('everything normal here', this.depth, hasChild, this);
            }
        }, 2000);
        return p;
    }
    save(obj?: T, options?: any): Promise<any> {
        if (this.child) {
            return this.child.save(obj, options);
        }
        return this.waitForChild().then(() => this.child.save(obj, options));
    }
    reorder(list: T[], options?: any): Promise<any> {
        if (this.child) {
            return this.child.reorder(list, options);
        }
        return this.waitForChild().then(() => this.child.reorder(list, options));
    }
    remove(obj: T, options?: any): Promise<any> {
        if (this.child) {
            return this.child.remove(obj, options);
        }
        return this.waitForChild().then(() => this.child.remove(obj, options));
    }
    delete(obj: T, options?: any): Promise<any> {
        if (this.child) {
            return this.child.delete(obj, options);
        }
        return this.waitForChild().then(() => this.child.delete(obj, options));
    }
    index(index: number): LiveObject<T> {
        return new WrapLiveObject<T>((setObj, subscriber) => {
            return this.childObservable.subscribe(() => {
                try {
                    if (this.child) {
                        setObj(this.child.index(index));
                    } else {
                        console.error('no child after child observable');
                        subscriber.next(null);
                    }
                } catch (e) {
                    subscriber.error(e)
                }
            }, e => subscriber.error(e));
        }, this.depth + 1);
    }
    toId(id: string, options?: any): LiveObject<T> {
        return new WrapLiveObject<T>((setObj, subscriber) => {
            return this.childObservable.subscribe(() => {
                try {
                    if (this.child) {
                        setObj(this.child.toId(id, options));
                    } else {
                        console.error('no child after child observable');
                        subscriber.next(null);
                    }
                } catch (e) {
                    subscriber.error(e)
                }
            }, e => subscriber.error(e));
        }, this.depth + 1);
    }
}
