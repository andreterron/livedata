import { DataManager } from './../data-manager';
import { SimpleStore } from "js-data";
import { BaseLiveObject } from "../base/base-live-object";
import { BaseDataManager } from '../base/base-data-manager';

export class JSDataOneToOneLiveList<T> extends BaseLiveObject<T> {

    constructor(
            dataManager: BaseDataManager,
            public store: SimpleStore,
            type: string,
            public fkField: string,
            public fkValue: string | number,
            options?: any) {
        super(
            dataManager,
            type,
            {refresh: (subscriber): Promise<T> => this.store.findAll(this.type, {where: {[this.fkField]: this.fkValue}}, this.options)
                .then(list => {
                    if (list && list[0]) {
                        this.id = list[0].id
                        return list[0];
                    }
                    return null;
                })},
            undefined, // id
            options,
        );
    }

}