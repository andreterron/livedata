import { BaseLiveObject } from '../../src/base/base-live-object';

import * as mocha from 'mocha';
import * as chai from 'chai';
import * as sinon from 'sinon';
import { BaseDataManager } from '../../src/base/base-data-manager';
import { Observable } from 'rxjs/Observable';
import * as sinonChai from 'sinon-chai';
import * as chaiAsPromised from 'chai-as-promised';
import { WrapLiveObject } from '../../src/index';

chai.use(sinonChai);
chai.use(chaiAsPromised);

const expect = chai.expect;

let mockObj = {id: 42, title: 'mock'};
let mockObj2 = {id: 10, title: 'two'};

describe('BaseLiveObject', () => {

    let sandbox = sinon.createSandbox();

    let childObj = sinon.createStubInstance(BaseLiveObject);
    childObj.subscribe.callsArgWith(0, mockObj);
    let childObj2 = sinon.createStubInstance(BaseLiveObject);
    childObj2.subscribe.callsArgWith(0, mockObj);
    let next = sandbox.spy();
    let err = sandbox.spy();
    let complete = sandbox.spy();

    let resetMain = () => {
        sandbox.reset(); // DEPRECATED: find replacement
        childObj.subscribe.resetHistory();
        childObj2.subscribe.resetHistory();
    }

    describe('fromObservable', () => {
        it('should subscribe to inner observable', () => {
            // Setup
            let observable = sinon.createStubInstance(Observable);
            observable.subscribe.callsArgWith(0, 42);

            let map = sinon.stub();
            map.withArgs(42).returns(childObj);
            map.throws();
            let obj = BaseLiveObject.fromObservable(observable, map);
            obj.subscribe(next);

            expect(observable.subscribe).to.be.calledOnce;
            expect(next).to.be.calledWith(mockObj);

            // Teardown
            resetMain();
        });
    });

    describe('createIfNone', () => {
        it('should only call next with the created object', () => {
            let dm = sinon.createStubInstance(BaseDataManager);
            let create = sinon.stub().resolves(mockObj);
            let refresh = sinon.stub();
            refresh.onCall(0).resolves(null);
            refresh.resolves(mockObj);
            let empty = new BaseLiveObject(dm, 'type', {refresh})
            let obj = empty.createIfNone(create);

            obj.subscribe(next, err, complete);

            return obj.refresh()
                .then(() => {
                    // expect(next).to.be.calledOnce;
                    expect(next, 'next 2').to.be.always.calledWith(mockObj); // TODO: called once maybe?
                    expect(err, 'err 2').to.not.be.called;
                    expect(complete, 'complete 2').to.not.be.called;
                    expect(refresh, 'refresh 2').to.be.called;
                    expect(create, 'create 2').to.be.calledOnce;
                    // Teardown
                    resetMain();
                });
        });
        it('should should call next of all objects and create once when multiple consecutive subscribes', () => {
            // Setup
            let dm = sinon.createStubInstance(BaseDataManager);
            var createResolve;
            let createPromise = new Promise((resolve, reject) => {
                createResolve = resolve;
            });
            let create = sinon.stub().returns(createPromise);
            let next2 = sinon.stub();
            let refresh = sinon.stub();
            refresh.onCall(0).resolves(null);
            refresh.resolves(mockObj);
            let empty = new BaseLiveObject(dm, 'type', {refresh})
            let obj = empty.createIfNone(create);

            // Execution
            obj.subscribe(next, err, complete);
            obj.subscribe(next2, err, complete);
            createResolve(mockObj);

            return obj.refresh()
                .then(() => {
                    // Assertion
                    expect(next, 'next').to.be.always.calledWith(mockObj); // TODO: called once maybe?
                    expect(next2, 'next 2').to.be.always.calledWith(mockObj); // TODO: called once maybe?
                    expect(err, 'err').to.not.be.called;
                    expect(complete, 'complete').to.not.be.called;
                    expect(refresh, 'refresh').to.be.called;
                    expect(create, 'create').to.be.calledOnce;

                    // Teardown
                    resetMain();
                });
    
        });
    });

    // it('should be able to add things correctly', () => {
    //     let manager = sinon.createStubInstance(BaseDataManager);
    //     let obj = new BaseLiveObject(manager, 'type', 'myid');
    // });

});