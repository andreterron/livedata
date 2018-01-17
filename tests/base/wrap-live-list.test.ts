import { BaseDataManager } from '../../src/base/base-data-manager';
import { BaseLiveObject, BaseLiveList, WrapLiveObject, WrapLiveList } from '../../src';

import * as mocha from 'mocha';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(sinonChai);
chai.use(chaiAsPromised);

const expect = chai.expect;


let subscribeFn = function(next, err, complete) {
    next(42);
}

interface MockType {
    id: string,
    title?: string
}

let mockObj = {id: 42, title: 'mock'};
let mockObj2 = {id: 10, title: 'two'};

describe('Wrap Live List', () => {
    let childList = sinon.createStubInstance(BaseLiveList);
    childList.subscribe.callsArgWith(0, mockObj);
    let childList2 = sinon.createStubInstance(BaseLiveList);
    childList2.subscribe.callsArgWith(0, mockObj2);
    let next = sinon.spy();



    // it('should subscribe to child object', () => {
    //     let obj = new WrapLiveList((setLiveList, subscriber) => {
    //         setLiveList(childList);
    //     });
    //     obj.subscribe(next)

    //     expect(next.withArgs(mockObj).calledOnce)
    //     expect(childList.subscribe.called).to.be.true;

    //     // Teardown
    //     childList.subscribe.resetHistory();
    //     next.reset();
    // });
    
    // it('should not subscribe to child object when not subscribed', () => {
    //     let obj = new WrapLiveList((setLiveObject, subscriber) => {
    //         setLiveObject(childList);
    //     });
    //     expect(childList.subscribe).to.not.be.called;
        
    //     // Teardown
    //     childList.subscribe.resetHistory();
    // });

    ['refresh', 'create', 'add', 'save', 'reorder', 'remove', 'delete'].forEach((method) => {
        it(`should subscribe and call ${method} on the child object when ${method} called`, () => {
            childList[method] = sinon.stub().resolves();
            // childList2[method] = sinon.stub().resolves();
            let obj = new WrapLiveList((setLiveObject, subscriber) => {
                setLiveObject(childList);
            });

            return obj[method](mockObj).then(() => {
                expect(obj.subscribers.length, 'temporary subscriber still subscribed').to.be.equal(0);
                // if (method === 'delete') {
                //     expect(childList2.subscribe, 'subscribe2 not called once').to.be.calledOnce
                //     expect(childList.subscribe, 'subscribe called').to.not.be.called
                // } else {
                //     expect(childList.subscribe, 'subscribe not called once').to.be.calledOnce
                //     expect(childList2.subscribe, 'subscribe2 called').to.not.be.called
                // }
                expect(childList[method], `${method} not called`).to.be.called;
    
                // Teardown
                childList.subscribe.resetHistory();
                childList[method].resetHistory();
            });
        });
    });

    // it('should resolve waitForChild() promise', () => {
    //     let obj = new WrapLiveObject((setLiveObject, subscriber) => {
    //         setLiveObject(childList);
    //     });

    //     let then = sinon.spy();

    //     expect(childList.subscribe).to.not.be.called;
    //     return obj.waitForChild()
    //         .then(then)
    //         .then(() => {
    //             expect(childList.subscribe).to.be.called;
    //             expect(obj.subscribers.length, 'temporary subscriber still subscribed').to.be.equal(0);
    //             expect(then, 'then not called').to.be.calledOnce;

    //             // Teardown
    //             childList.subscribe.resetHistory();
    //         });
    // });

});