import { BaseDataManager } from '../../src/base/base-data-manager';
import { ILiveObject } from '../../src';

import * as mocha from 'mocha';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(sinonChai);
chai.use(chaiAsPromised);

const expect = chai.expect;

let mockObj = {id: 42, title: 'mock'};
let mockObj2 = {id: 10, title: 'two'};
