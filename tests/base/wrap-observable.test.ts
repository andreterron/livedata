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

let mockObj = {id: 42, title: 'mock'};
let mockObj2 = {id: 10, title: 'two'};

describe('Wrap Observable', () => {
    let childObj = sinon.createStubInstance(BaseLiveObject);
    childObj.subscribe = sinon.stub().callsArgWith(0, mockObj);
    let childObj2 = sinon.createStubInstance(BaseLiveObject);
    childObj2.subscribe = sinon.stub().callsArgWith(0, mockObj2);
    let childList = sinon.createStubInstance(BaseLiveList);
    childList.subscribe.callsArgWith(0, mockObj);
    let next = sinon.spy();
    let err = sinon.spy();
    let complete = sinon.spy();

    let resetMain = () => {
        childObj.subscribe.resetHistory();
        next.reset();
        err.reset();
        complete.reset();
    }



    it('should subscribe to child object', () => {
        let obj = new WrapLiveObject((setLiveObject, subscriber) => {
            setLiveObject(childObj);
        });
        obj.subscribe(next, err, complete);

        expect(next).to.be.calledOnce;
        expect(next).to.be.calledWith(mockObj); //.withArgs(mockObj).calledOnce)
        expect(err).to.not.be.called;
        expect(complete).to.not.be.called;
        expect(childObj.subscribe).to.be.called;

        // Teardown
        resetMain();
    });
    
    it('should not subscribe to child object when not subscribed', () => {
        let obj = new WrapLiveObject((setChild, subscriber) => {
            setChild(childObj);
        });
        expect(childObj.subscribe).to.not.be.called;
        
        // Teardown
        childObj.subscribe.resetHistory();
    });

    it('should resolve waitForChild() promise', () => {
        let obj = new WrapLiveObject((setChild, subscriber) => {
            setChild(childObj);
        });

        let then = sinon.spy();

        return obj.waitForChild()
            .then(then)
            .then(() => {
                expect(then, 'then not called').to.be.calledOnce;

                // Teardown
                resetMain();
            });
    });
    
    it('should observe value when the child changes', () => {
        // Setup
        var setFn;
        let obj = new WrapLiveObject((setChild, subscriber) => {
            setFn = setChild;
            setChild(childObj);
        });

        obj.subscribe(next, err, complete);
        
        expect(next).to.be.calledOnce;
        expect(next).to.be.calledWith(mockObj);
        expect(err).to.not.be.called;
        expect(complete).to.not.be.called;

        next.reset();

        setFn(childObj2);

        expect(next).to.be.calledOnce;
        expect(next).to.be.calledWith(mockObj2);
        expect(err).to.not.be.called;
        expect(complete).to.not.be.called;
        expect(childObj.subscribe).to.be.calledOnce;
        expect(childObj2.subscribe).to.be.calledOnce;

        resetMain();
    });

    it('should observe child updates when the child changes', () => {
        var currentChild = childObj;
        var i = 1;
        var setFn;
        let obj = new WrapLiveObject((setChild, subscriber) => {
            setFn = setChild;
            setChild(childObj);
        });

        let childNext = sinon.spy(() => {
            expect(obj.child, `child ${i}`).to.be.deep.equal(currentChild);
            expect(next, `child ${i}`).to.be.calledOnce;
            expect(err, `child ${i}`).to.not.be.called;
            expect(complete, `child ${i}`).to.not.be.called;
            i++;
        });

        obj.childObservable.subscribe(next, err, complete);

        expect(obj.subscribers.length).to.be.equal(1);
        expect(obj.childSubscriptions.length).to.be.equal(1);

        next.reset();

        currentChild = childObj2;
        setFn(childObj2);

        expect(obj.subscribers.length).to.be.equal(1);
        // expect(childObj.subscribe).to.be.calledOnce;
        // expect(childObj2.subscribe).to.be.calledOnce;

        resetMain();
    });

    it('should trigger a wrapper update when the child refreshes', () => {
        // Setup
        var sub;
        childObj.toMany.returns(childList);
        childObj.refresh.callsFake(() => {
            sub.next(mockObj2);
            return Promise.resolve(mockObj2);
        });
        let obj = new WrapLiveObject((setChild, subscriber) => {
            setChild(childObj);
            sub = subscriber;
        });

        obj.subscribe(next, err, complete);

        expect(next, 'next').to.be.calledOnce;
        expect(next, 'next').to.be.calledWith(mockObj);
        next.reset();
        childObj.refresh.resetHistory();
        
        return obj.refresh()
            .then(() => {
                expect(childObj.refresh, 'child.refresh').to.be.calledOnce;
                expect(next, 'next').to.be.calledOnce;
                expect(next, 'next').to.be.calledWith(mockObj2);


                resetMain();
                childObj.refresh.reset();
            });
    })

});