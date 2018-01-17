import { BaseLiveObject } from './../base/base-live-object';
import { RelationsDefinition, ILiveObject, ILiveList } from './../interfaces';
import { BaseDataManager } from '../base/base-data-manager';
import * as firebase from 'firebase';
import { FirestoreQueryLiveList } from './firestore-query-live-list';
import { FirestoreManyToManyLiveList } from './firestore-many-to-many-live-list';
import { FirestoreOneToManyLiveList } from './firestore-one-to-many-live-list';
import { FirestoreSubCollectionLiveList } from './firestore-sub-collection-live-list';
import { FirestoreLiveObject } from './firestore-live-object';

export class FirestoreDataManager extends BaseDataManager {

    private rootRef: firebase.firestore.DocumentReference;
    public _isFirestore = true;

    constructor(relations: RelationsDefinition = {}, private db: firebase.firestore.Firestore, options?: any) {
        super(relations, options)
        this.rootRef = options && options.rootRef || db.doc('/');
    }

    hasTypeHook(type: string, hook: string) {
        return (this.options && this.options.typeOptions && this.options.typeOptions[type] && typeof this.options.typeOptions[type][hook] === 'function');
    }

    hasGlobalHook(hook: string) {
        return (this.options && this.options.hooks && typeof this.options.hooks[hook] === 'function');
    }

    async hookBefore(type: string, hook: string, obj: any, options: any): Promise<any> {
        if (this.hasTypeHook(type, hook)) {
            await this.options.typeOptions[type][hook](obj, options)
        }
        if (this.hasGlobalHook(hook)) {
            return this.options.hooks[hook](type, obj, options);
        }
    }

    async hookAfter(type: string, hook: string, obj: any, options: any, res): Promise<any> {
        if (this.hasGlobalHook(hook)) {
            await this.options.hooks[hook](type, obj, options, res);
        }
        if (this.hasTypeHook(type, hook)) {
            return this.options.typeOptions[type][hook](obj, options, res);
        }
    }

    getCollection(type, options?: any) {
        if (options && options.collectionRef) {
            return options.collectionRef;
        }
        return this.rootRef.collection(type);
    }

    liveObject<T>(type: string, id: string, options?: any): ILiveObject<T> {
        return new FirestoreLiveObject(this, type, {subscribeOnce: (subscriber) => {
            return this.getCollection(type, options).doc(id).onSnapshot({
                next: (snap) => {
                    subscriber.next(snap.exists ? (Object.assign({id: snap.id}, snap.data() as T)) : null)
                },
                error: (err) => {subscriber.error(err)},
                complete: () => {subscriber.complete()}
            });
        }}, id, options);
    }
    liveQuery<T>(type: string, query?: any, options?: any): ILiveList<T> {
        return new FirestoreQueryLiveList<T>(this, this.rootRef, type, query, options);
    }
    toOne<T>(type: string, obj: any, relationName: string, options?: any): ILiveObject<T> {
        let relation = this.relations[type][relationName];
        if (relation.to === 'one') {
            
        } else if (relation.to === 'ref') {
            // return BaseLiveObject.fromObservable(this.liveObject(type, obj.id, options), (src) => {
            //     src[relation.localField].onSnapshot({
            //         next: (snap) => {
            //             subscriber.next(snap.exists ? (Object.assign({id: snap.id}, snap.data() as T)) : null)
            //         },
            //         error: (err) => {subscriber.error(err)},
            //         complete: () => {subscriber.complete()}
            //     })
            // })
            return new FirestoreLiveObject(this, type, {subscribeOnce: (subscriber) => {
                obj[relation.localField].onSnapshot({
                    next: (snap) => {
                        subscriber.next(snap.exists ? (Object.assign({id: snap.id}, snap.data() as T)) : null)
                    },
                    error: (err) => {subscriber.error(err)},
                    complete: () => {subscriber.complete()}
                });
            }}, undefined, options);
            // relation.localField;
            // relation.type;
            // return new JSDataIdLiveObject<T>(this.store, this, relation.type, obj[relation.localKey], options);
        }
        throw new Error('toOne not yet implemented');
        // return null;
    }
    toMany<T>(type: string, obj: any, relationName: string, options?: any): ILiveList<T> {
        let relation = this.relations[type][relationName];
        if (relation.to === 'many') {
            if (relation.method === 'sub-collection') {
                return new FirestoreSubCollectionLiveList(
                    this,
                    this.rootRef,
                    type,
                    this.getCollection(type, options).doc(obj.id),
                    relation,
                    options
                );
            }
            if (relation.edge) { // manyToMany
                let rev = this.relations[relation.type][relation.reverseName];
                return new FirestoreManyToManyLiveList(
                    this,
                    this.rootRef,
                    type,
                    this.getCollection(type, options).doc(obj.id),
                    relation,
                    rev,
                    options);
            } else { // is oneToMany
                return new FirestoreOneToManyLiveList(
                    this,
                    this.rootRef,
                    relation.type,
                    this.getCollection(type, options).doc(obj.id),
                    relation,
                    options);
            }
        }
        // throw new Error('toMany not yet implemented');
        return null;
    }
    save(type: string, obj: any, options?: any): Promise<any> {
        // return this.store.update(type, obj.id, obj, options);
        return this.getCollection(type, options).doc(obj.id).set(obj).then(null, e => {console.error('ERROR SAVING'); throw e});
    }
    create(type: string, obj: any, options?: any): Promise<any> {
        // return this.store.create(type, obj, options);
        obj = this.normalizeObject(type, obj, options && options.references, options);
        return this.hookBefore(type, 'beforeCreate', obj, options)
            .then(() => {
                if (obj.id) {
                    return this.getCollection(type, options).doc(obj.id).set(obj)
                        .then(() => obj);
                }
                return this.getCollection(type, options).add(obj)
                    .then((ref) => {
                        // TODO: review the need to update ids (options: generate ids OR update on the server OR user-defined option)
                        // ref.update({id: ref.id});
                        return Object.assign({id: ref.id}, obj);
                    });
            }).then((res) => {
                return this.hookAfter(type, 'afterCreate', obj, options, res).then(() => res);
            });
    }
    delete(type: string, obj: any, options?: any): Promise<any> {
        return this.getCollection(type, options).doc(obj.id).delete();
    }

    normalizeObject(type: string, obj: any, references?: {[relation: string]: any}, options?: any) {
        if (references) {
            Object.keys(references).forEach(rel => {
                let relation = this.relations[type][rel];
                obj[relation.localField] = this.getCollection(relation.type).doc(references[rel].id);
            });
        }
        return obj;
    }

    // abstract toOne<R>(obj: T, relation: string, options: any): Observable<R>
    // abstract find(id: any): Observable<T>

}