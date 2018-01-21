import { BaseLiveObject } from './../base/base-live-object';
import { RelationsDefinition, LiveObject, LiveList } from './../interfaces';
import { JSDataOneToManyLiveList } from './jsdata-one-to-many-live-list';
import { SimpleStore, DataStore } from 'js-data';
import { JSDataQueryLiveList } from './jsdata-query-live-list';
import { BaseDataManager } from '../base/base-data-manager';
import { JSDataIdLiveObject } from './jsdata-id-live-object';
import { JSDataManyToManyLiveList } from './jsdata-many-to-many-live-list';

export class JSDataDataManager extends BaseDataManager {

    public store: SimpleStore;

    constructor(relations: RelationsDefinition = {}, store: SimpleStore, options?: any) {
        super(relations, options)
        this.store = store;
        this.parseRelations(options && options.schemas);
    }

    parseRelations(schemas?: any) {
        // let relations 
        let types = Object.assign({}, this.options && this.options.typeOptions || {});
        // Add from schemas
        if (schemas) {
            Object.keys(schemas).forEach((type) => {
                types[type] = {
                    schema: schemas[type]
                };
            });
        }

        // Add from relations
        for (var from in this.relations) {
            types[from] = types[from] || {};
            for (var fromName in this.relations[from]) {
                let rel = this.relations[from][fromName];
                types[from] = types[from] || {}
                if (rel.to === 'many') {
                    types[from].hasMany = types[from].hasMany || {};
                    if (rel.edge) { // many-to-many
                        types[from].hasMany[rel.edge] = {
                            foreignKey: rel.foreignKey,
                            localField: rel.edgeField
                        };
                    } else { // one-to-many
                        types[from].hasMany[rel.type] = {
                            foreignKey: rel.foreignKey,
                            localField: rel.localField
                        };
                    }
                } else if (rel.to === 'one') {
                    types[from].hasOne = types[from].hasOne || {};
                    types[from].hasOne[rel.type] = {
                        foreignKey: rel.foreignKey,
                        localField: rel.localField
                    };
                } else if (rel.to === 'ref') {
                    types[from].belongsTo = types[from].belongsTo || {};
                    types[from].belongsTo[rel.type] = {
                        foreignKey: rel.localKey,
                        localField: rel.localField
                    };
                }
            }
        }

        // Add types to store
        Object.keys(types).forEach(key => {
            this.store.defineMapper(key, types[key]);
        });
    }

    liveObject<T>(type: string, id: string, options?: any): LiveObject<T> {
        return new JSDataIdLiveObject<T>(this.store, this, type, id, options);
    }
    liveQuery<T>(type: string, query?: any, options?: any): LiveList<T> {
        return new JSDataQueryLiveList<T>(this, this.store, type, query, options);
    }
    toOne<T>(type: string, obj: any, relationName: string, options?: any): LiveObject<T> {
        let relation = this.relations[type][relationName];
        if (relation.to === 'one') {
            return new JSDataOneToManyLiveList<T>(
                this,
                this.store,
                relation.type,
                obj.id,
                relation,
                options).index(0);
        } else if (relation.to === 'ref') {
            relation.localField;
            relation.type;
            return new JSDataIdLiveObject<T>(this.store, this, relation.type, obj[relation.localKey], options);
        }
        return null;
    }
    toMany<T>(type: string, obj: any, relationName: string, options?: any): LiveList<T> {
        let relation = this.relations[type][relationName];
        if (relation.to === 'many') {
            if (relation.edge) { // manyToMany
                let rev = this.relations[relation.type][relation.reverseName];
                return new JSDataManyToManyLiveList(
                    this,
                    this.store,
                    type,
                    obj.id,
                    relation,
                    rev,
                    options);
            } else { // is oneToMany
                return new JSDataOneToManyLiveList(
                    this,
                    this.store,
                    relation.type,
                    obj.id,
                    relation,
                    options);
            }
        }
        return null;
    }
    save(type: string, obj: any, options?: any): Promise<any> {
        return this.store.update(type, obj.id, obj, options);
    }
    create(type: string, obj: any, options?: any): Promise<any> {
        return this.store.create(type, obj, options);
    }
    delete(type: string, obj: any, options?: any): Promise<any> {
        return this.store.destroy(type, obj.id, options);
    }

    // abstract toOne<R>(obj: T, relation: string, options: any): Observable<R>
    // abstract find(id: any): Observable<T>

}