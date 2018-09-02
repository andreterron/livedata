import { LiveRef, LiveSnap } from '../../src/v2/base';
import { ActionDefinition, LiveQuery, Action, ActionExec, ActionResult, ActionInput } from '../../src/v2/actions';
import { OpenFile } from './test-types';

let registerAction: ActionDefinition = <T, U extends any[]>(query: LiveQuery<T>, action: Action<T, U>): ActionExec<T, U> => {
    return (req: ActionInput<T>, ...args: U) => {
        let exec: ActionResult<any> = {};
        for (let k in req) {
            exec[k] = {
                ref: req[k].ref,
                value: null
            };
        }
        return action(exec as ActionResult<T>, ...args);
    };
}

let save = registerAction({ file: {path: true} }, (params: {file: LiveSnap<OpenFile>}, content: string) => {

});

save({file: {ref: '123'}}, 'hello')
