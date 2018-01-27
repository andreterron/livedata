import { BaseDataManager } from '../../src/base/base-data-manager';
import { BaseLiveObject, WrapLiveObject, BaseLiveList } from '../../src';

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

let mockObj = {id: '42', title: 'mock'};
let mockObj2 = {id: '10', title: 'two'};
let mockList = [{id: '3', title: 'hello'}, {id: '83', title: 'world'}];

describe('Wrap Live Object', () => {
    let childObj = sinon.createStubInstance(BaseLiveObject);
    childObj.subscribe.callsArgWith(0, mockObj);
    let childList = sinon.createStubInstance(BaseLiveList);
    childList.subscribe.callsArgWith(0, mockList);
    let next = sinon.spy();
    let err = sinon.spy();
    let complete = sinon.spy();

    let resetMain = () => {
        childObj.subscribe.resetHistory();
        childList.subscribe.resetHistory();
        next.reset();
        err.reset();
        complete.reset();
    }

    class TestWrapLiveObject<T> extends WrapLiveObject<T> {
        subscribersLength() {
            return this.subscribers.length
        }
    }

    ['refresh', 'save', 'delete'].forEach((method) => {
        it(`should subscribe and call ${method} on the child object when ${method} is called`, () => {
            let obj = new TestWrapLiveObject((setLiveObject, subscriber) => {
                setLiveObject(childObj);
            });
            childObj[method].withArgs(mockObj).resolves(mockObj);
            return obj[method](mockObj).then(() => {
                expect(childObj.subscribe, 'subscribe not called once').to.be.calledOnce
                expect(childObj[method], `${method} not called`).to.be.called;
                expect(obj.subscribersLength(), 'temporary subscriber still subscribed').to.be.equal(0);
    
                // Teardown
                childObj.subscribe.resetHistory();
                childObj[method].resetHistory();
                next.reset();
            });
        });
    });

    it('should return a LiveList when calling toMany', () => {
        // Setup
        childObj.toMany.returns(childList);
        let obj = new WrapLiveObject((setChild, subscriber) => {
            setChild(childObj);
        });
        let rel = obj.toMany('');
        rel.subscribe(next, err, complete);

        expect(childList.subscribe, 'child list').to.be.calledOnce;
        expect(childObj.toMany, 'child object to many').to.be.calledOnce;
        expect(childObj.subscribe, 'child object sub').to.be.calledOnce;
        expect(next, 'next').to.be.calledOnce;
        expect(next, 'next').to.be.calledWith(mockList);
        expect(err, 'err').to.not.be.called;
        expect(complete, 'complete').to.not.be.called;

        resetMain();
    });



    describe('createIfNone', () => {
        it('should call child createIfNone', async () => {
            // Setup
            let create = sinon.stub();
            let empty = sinon.createStubInstance(BaseLiveObject);
            empty.subscribe.callsArgWith(0, mockObj);
            empty.createIfNone.returns(empty);
            let wrap = new WrapLiveObject((setChild, subscriber) => {
                setChild(empty);
            })
            let obj = wrap.createIfNone(create);
            let subResult = await new Promise((resolve, reject) => {
                obj.subscribe(resolve, reject, complete)
            });

            // Validation
            expect(subResult, 'result').to.be.equal(mockObj)
            expect(empty.createIfNone, 'child createIfNone').to.be.calledOnce.calledWith(create);
            expect(complete, 'complete').to.not.be.called;

            // Teardown
            resetMain();
        });
    });

});