import { normalizeRelations } from "../../src/base/base-data-manager";

import * as mocha from 'mocha';
import * as chai from 'chai';

const expect = chai.expect;

describe('Normalize Relations', () => {
    it('should ensure reverse reference when passed a to:many relation', () => {
        let relations = normalizeRelations({
            user: {
                task: {
                    to: 'many'
                }
            }
        });
        expect(relations.task.user.to).to.be.equal('ref');
    });
});