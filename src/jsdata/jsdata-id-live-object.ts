import { Subscriber } from 'rxjs/Subscriber';
import { SimpleStore } from 'js-data';
import { BaseLiveObject } from './../base/base-live-object';
import { BaseDataManager } from '../base/base-data-manager';
import { TeardownLogic } from 'rxjs/Subscription';

export class JSDataIdLiveObject<T> extends BaseLiveObject<T> {

    constructor(public store: SimpleStore, dataManager: BaseDataManager, type: string, id: string, options?: any) {
        super(dataManager, type, {refresh: () => this.store.find(this.type, this.id, this.options)}, id, options);
    }
}