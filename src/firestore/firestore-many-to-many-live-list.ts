import { BaseLiveList } from "../base/base-live-list";
import { RelationSide } from "../interfaces/relations.interface";
import { BaseDataManager } from "../base/base-data-manager";
import { firestore } from "firebase";
import { TeardownLogic } from "rxjs/Subscription";
import { Observable } from "rxjs/Observable";

export class FirestoreManyToManyLiveList<T> extends BaseLiveList<T> {

    public nextIndex: number = 0;
    public lastEdges: any[];

    private creating: boolean = false;

    constructor(
            dataManager: BaseDataManager,
            public rootRef: firestore.DocumentReference,
            type: string,
            public srcRef: firestore.DocumentReference,
            public relation: RelationSide,
            public reverseRelation: RelationSide,
            public options?: any) {
        super(dataManager, type, {subscribeOnce: (subscriber): TeardownLogic => {
            // return this.edgeQuery().onSnapshot({
            //     next: (snapshot) => {
            //         this.lastEdges = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
            //         if (this.relation.indexField) {
            //             this.nextIndex = 1 + this.lastEdges.map(e => e[this.relation.indexField]).reduce((prev, curr) => Math.max(prev, curr), this.nextIndex);
            //         }
            //         Observable.combineLatest(snapshot.docs.map((doc): Observable<T> => {
            //             return new Observable<T>((sub) => {
            //                 if (doc.exists) {
            //                     doc.data()[this.reverseRelation.foreignField].onSnapshot({
            //                         next: (snap: firestore.DocumentSnapshot) => {
            //                             sub.next(Object.assign({id: snap.id}, snap.data() as T));
            //                         },
            //                         error: (e) => {
            //                             // console.error('ACL - ERROR', this.creating, e.code);
            //                             // if (e.code !== 'permission-denied') {
            //                             //     console.error('ACL - edge obj error', doc.id, doc.data());
            //                             //     console.error(e);
            //                             sub.error(e);
            //                             // } else {
            //                             //     console.log('got err');
            //                             // }
            //                         },
            //                         complete: () => sub.complete()
            //                     });
            //                 } else {
            //                     sub.next(null);
            //                 }
            //             });
            //         })).subscribe(n => {
            //             subscriber.next(n)
            //         }, e => {subscriber.error(e)}, () => {
            //             subscriber.next([]);
            //         });
            //     },
            //     error: e => {subscriber.error(e)},
            //     complete: () => {subscriber.complete()}
            // });
        }});
    }

    edgeQuery(): firestore.CollectionReference | firestore.Query {
        var q = this.rootRef.collection(this.relation.edge).where(this.relation.foreignField, '==', this.srcRef)
        if (this.relation.indexField) {
            q = q.orderBy(this.relation.indexField, 'asc');
        }
        return q;
    }

    // refresh(): Promise<T[]> {
    //     // return Promise.reject('WHAT REFRESH?');
    // }
    
    // refresh(): Promise<T[]> {
    //     var resMap = {};
    //     var ids: any[];
    //     return this.store.findAll(
    //             this.relation.edge,
    //             {
    //                 where: {[this.relation.foreignKey]: this.id},
    //                 orderBy: this.relation.indexField ? [[this.relation.indexField, 'ASC']] : undefined
    //             })
    //             // {
    //             //     with: [this.reverseRelation.foreignField] // Not working :(
    //             // })
    //         .then((edges) => {
    //             this.nextIndex = edges.length;
    //             ids = edges.map(e => e[this.reverseRelation.foreignKey]);
    //             // return edges.map((edge) => edge[this.reverseRelation.foreignField]) // 'with' not working :(
    //             return this.store.findAll(this.relation.type, {
    //                 where: {id: {in: ids}}
    //             })
    //         })
    //         .then((list: any[]) => {
    //             list.forEach((item) => {
    //                 resMap[item.id] = item;
    //             });
    //             return ids.map((id) => resMap[id]).filter(item => !!item);
    //         })
    //         .then(this.alert.bind(this), this.alertError.bind(this));
    // }

    create(data: any, extra?: any, options?: any): Promise<T> {
        var created:T;
        this.creating = true;
        return this.dataManager.create(this.relation.type, data, options)
            .then((c: T) => {
                created = c;
                if (!this.options || !this.options.noAddOnCreate) {
                    return this._add(c, undefined, options);
                }
            })
            .then(() => {
                this.creating = false;
                return created;
            });
        // return this.store
        //     .create(this.relation.type, data, options)
        //     .then((c) => {
        //         created = c;
        //         if (!this.options.noAddOnCreate) {
        //             return this._add(c, undefined, options);
        //         }
        //     })
        //     .then(() => {
        //         this.refresh();
        //         return created;
        //     });
    }
    _add(obj: T, extra?: any, options?: any): Promise<any> {
        return (!this.lastEdges ? this.once() : Promise.resolve(this.lastEdges))
            .then(() => {
                let edge = {};
                if (this.relation.indexField) {
                    edge[this.relation.indexField] = this.nextIndex++;
                }
                let newRef = this.rootRef.collection(this.relation.type).doc(obj['id']);
                let filteredEdges = this.lastEdges.filter(e =>
                    this.srcRef.isEqual(e[this.relation.foreignField]) &&
                    newRef.isEqual(e[this.reverseRelation.foreignField]));
                if (filteredEdges.length > 0) {
                    // Already added
                    return Promise.resolve(filteredEdges[0]);
                } else {
                    // Create edge
                    Object.assign(edge, extra || {}, {
                        [this.relation.foreignField]: this.srcRef,
                        [this.reverseRelation.foreignField]: this.rootRef.collection(this.relation.type).doc(obj['id']),
                    });
                    return this.dataManager.create(this.relation.edge, edge, options);
                }
            });
    }
    add(obj: T, extra?: any, options?: any): Promise<any> {
        return this._add(obj, extra, options);
    }
    save(obj?: T, options?: any): Promise<any> {
        // var promise = this.store.update(this.type, obj['id'], obj, options);
        var promise = this.dataManager.save(this.relation.type, obj, options);
        if (options && options.edgeData) {
            return Promise.all([promise, this.saveEdge(options.edgeData, options)]);
        }
        return promise;
    }
    saveEdge(edge: any, options?: any): Promise<any> {
        return this.dataManager.save(this.relation.edge, edge, options);
        // return this.store.update(this.relation.edge, edge['id'], edge, options).then(this.thenRefresh.bind(this));
    }
    reorder(list: T[], options?: any): Promise<any> {
        if (this.relation.indexField) {
            let ids = list.map(i => i['id']);
            let indexMap = {};
            ids.forEach((id, i) => {indexMap[id] = i;});
            let edges = this.lastEdges
            let edgeCollection = this.rootRef.collection(this.relation.edge);
            let batch = this.rootRef.firestore.batch();
            for (var i = 0; i < edges.length; i++) {
                let revId = edges[i][this.reverseRelation.foreignField].id;
                if (typeof indexMap[revId] !== 'number') {
                    // Edge is connected to an object not present in the list
                    batch.delete(edgeCollection.doc(edges[i].id));
                } else  {
                    if (edges[i][this.relation.indexField] !== indexMap[revId]) {
                        // Edge exists, but index is different
                        batch.update(edgeCollection.doc(edges[i].id), {[this.relation.indexField]: indexMap[revId]})
                    }
                    if (ids.indexOf(revId) !== -1) {
                        ids.splice(ids.indexOf(revId), 1);
                    }
                }
            }
            this.nextIndex = list.length;
            return Promise.all(ids.map((id) => {
                return this.add(list[indexMap[id]], {[this.relation.indexField]: indexMap[id]}, options);
            }).concat(batch.commit()));
        }
        return Promise.reject("Cannot reorder this list");
    }
    remove(obj: T, options?: any): Promise<any> {
        // let where = {[this.reverseRelation.foreignKey]: obj['id']};
        // if (options && options.index) {
        //     where[this.relation.indexField] = options.index;
        // }
        // return this.store.destroyAll(this.relation.edge, {where: where, limit: 1}, options).then(this.thenRefresh.bind(this));
        return Promise.reject("Not Implemented");
    }
    delete(obj: T, options?: any): Promise<any> {
        return Promise.reject("Not Implemented");
        // let where = {[this.reverseRelation.foreignKey]: obj['id']};
        // if (options && options.index) {
        //     where[this.relation.indexField] = options.index;
        // }
        // return Promise.all([
        //     this.store.destroyAll(this.relation.edge, {where: where, limit: 1}, options),
        //     this.store.destroy(this.relation.type, obj['id'], options)
        // ]).then(this.thenRefresh.bind(this));
    }
}