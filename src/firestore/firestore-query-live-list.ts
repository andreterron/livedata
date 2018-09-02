import { Subscriber } from 'rxjs/Subscriber';
import { Observable } from "rxjs/Observable";
import { TeardownLogic, Subscription } from 'rxjs/Subscription';
import { BaseLiveList } from '../base/base-live-list';
import { BaseDataManager } from '../base/base-data-manager';
import { firestore } from 'firebase';
import { RelationSide } from '../interfaces/relations.interface';

let operations = ['<', '<=', '==', '>=', '>'];

export class FirestoreQueryLiveList<T> extends BaseLiveList<T> {

    // private currentTeardown: (() => void)[] = [];

    constructor(dataManager: BaseDataManager, public rootRef: firestore.DocumentReference, public type: string, private query?: any, public options?: any) {
        super(dataManager, type, {subscribeOnce: (subscriber) => {
            return this.queryCollection().onSnapshot({
                next: (snap) => {subscriber.next(snap.docs.map(snap => Object.assign({id: snap.id}, snap.data() as T)))},
                error: (err) => {console.error(err); subscriber.error(err)},
                complete: () => {subscriber.complete()}
            });
            // this.currentTeardown.push(teardown);
            // return teardown;
        }});
        // if (this.options && this.options.indexField && (!this.query || !this.query.orderBy)) {
        //     this.query = this.query || {};
        //     this.query.orderBy = this.query.orderBy || [[this.options.indexField,'ASC'], ['id', 'ASC']];
        // }
    }

    async once(): Promise<T[]> {
        let snap = await this.queryCollection().get();
        return snap.docs.map(snap => Object.assign({id: snap.id}, snap.data() as T));
    }

    collectionRef(): firestore.CollectionReference {
        return this.rootRef.collection(this.type)
    }

    queryCollection(): firestore.Query | firestore.CollectionReference {
        if (typeof this.query === 'function') {
            return this.query(this.collectionRef());
        } else if (this.query) {
            var q: firestore.Query | firestore.CollectionReference = this.collectionRef();
            // let query: any = this.query;
            if (this.query.where) {
                Object.keys(this.query.where).forEach((w) => {
                    var key = w;
                    // var value;
                    var relation: RelationSide = null;
                    if (this.dataManager.relations && this.dataManager.relations[this.type]) {
                        let rels = Object.keys(this.dataManager.relations[this.type]);
                        for (var i = 0; i < rels.length; i++) {
                            var relName = rels[i];
                            if (this.dataManager.relations[this.type][relName].localKey === w) {
                                relation = this.dataManager.relations[this.type][relName];
                                key = relation.localField;
                                break;
                            }
                        }
                    }
                    if (this.query.where[w] && operations.filter(op => this.query.where[w][op] !== undefined).length > 0) {
                        console.log('WHERE', this.query.where[w]);
                        Object.keys(this.query.where[w]).forEach((op: firestore.WhereFilterOp) => {
                            let value = relation ? this.rootRef.collection(relation.type).doc(this.query.where[w][op]) : this.query.where[w][op];
                            console.log('HERE BE OTHER WHERE', key, op, value)
                            q = q.where(key, op, value);
                        });
                    } else {
                        let value = relation ? this.rootRef.collection(relation.type).doc(this.query.where[w]) : this.query.where[w];
                        console.log('HERE BE WHERE', key, value);
                        q = q.where(key, '==', value);
                    }
                });
            }
            if (this.query.orderBy) {
                console.log('HAS QUERY ORDER BY', this.query.orderBy);
                this.query.orderBy.forEach(order => {
                    q = q.orderBy(order[0], order[1].toLowerCase());
                });
            }
            // console.log(q);
            return q;
            // throw new Error("object query not implemented yet");
        }
        return this.collectionRef();
    }

    // refresh(): Promise<T[]> {
    //     // this.currentTeardown.forEach((td) => {
    //     //     if (td) td();
    //     // });
    //     // let q = this.queryCollection();
    //     // this.currentTeardown = this.subscribers.map((sub) => q.onSnapshot({
    //     //     next: (snap) => {sub.next(snap.docs.map(snap => snap.data()) as T[])},
    //     //     error: (err) => {sub.error(err)},
    //     //     complete: () => {sub.complete()}
    //     // }));
    //     return this.queryCollection().get().then((snap) => {
    //         return snap.docs.map(snap => Object.assign({id: snap.id}, snap.data() as T));
    //     });
    // }

    add(obj: T, extra?: any, options?: any): Promise<any> {
        if (!this.query) {
            return this.dataManager.create(this.type, obj, options);
        }
        return Promise.reject("Cannot add to this list");
    }
    remove(obj: T, options?: any): Promise<any> {
        if (!this.query) {
            return this.dataManager.delete(this.type, obj, options);
        }
        return Promise.reject("Cannot remove from this list");
    }
    create(data: any, extra?: any, options?: any): Promise<T> {
        if (!this.query) {
            return this.dataManager.create(this.type, data, options);
        }
        return Promise.reject("Cannot create on this list");
    }
    save(obj?: T, options?: any): Promise<any> {
        if (obj) {
            return this.dataManager.save(this.type, obj, options);
        }
    }
    reorder(list: T[], options?: any): Promise<any> {
        // TODO: review this pls
        if (this.options && this.options.indexField) {
            let promises: Promise<any>[] = [];
            for (var i = 0; i < list.length; i++) {
                if (list[i][this.options.indexField] !== i) {
                    list[i][this.options.indexField] = i;
                    promises.push(this.save(list[i]));
                }
            }
            return Promise.all(promises);
        }
        return Promise.reject("Cannot reorder this list");
    }
    delete(obj: T, options?: any): Promise<any> {
        return this.dataManager.delete(this.type, obj, options);
    }

}