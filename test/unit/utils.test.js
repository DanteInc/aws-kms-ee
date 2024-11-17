import 'mocha';
import { expect } from 'chai';
import Sinon from 'sinon';

import { encryptValue, decryptValue, getClientLogger, debug } from '../../src/utils';
import * as crypto from '../../src/crypto';

import { MOCK_GEN_DK_RESPONSE, MOCK_DECRYPT_DK_RESPONSE } from '../../src/fixtures';

const VALUE = '33E44';
const VALUE2 = { field1: VALUE };

describe('utils.js', () => {
  it('should encrypt and decrypt', () => {
    const encrypted = encryptValue('f1', VALUE, {
      Plaintext: MOCK_GEN_DK_RESPONSE.Plaintext,
    });
    // console.log(encrypted);

    const decrypted = decryptValue('f1', encrypted, {
      Plaintext: MOCK_DECRYPT_DK_RESPONSE.Plaintext,
    });
    expect(decrypted).to.equal(VALUE);
  });
  it('should hash', () => {
    const encrypted = encryptValue('f1', VALUE, {
      Plaintext: MOCK_GEN_DK_RESPONSE.Plaintext,
    }, false);
    // console.log(encrypted);

    const decrypted = decryptValue('f1', encrypted, {
      Plaintext: MOCK_DECRYPT_DK_RESPONSE.Plaintext,
    }, false);
    expect(decrypted).to.equal(VALUE);
  });
  it('should decrypt unstringified string - forwards compatibility', () => {
    const encrypted = crypto.encrypt(VALUE, MOCK_DECRYPT_DK_RESPONSE.Plaintext.toString(), true).toString();
    // simulates the previous code
    // const stringify = value => (typeof value !== 'string' ? JSON.stringify(value) : value);

    const decrypted = decryptValue('f1', encrypted, {
      Plaintext: MOCK_DECRYPT_DK_RESPONSE.Plaintext,
    });
    expect(decrypted).to.equal(VALUE);
  });
  it('should ignore forward compatibility for encrypted stringified object', () => {
    const encrypted = encryptValue('f1', VALUE2, {
      Plaintext: MOCK_GEN_DK_RESPONSE.Plaintext,
    });
    const decrypted = decryptValue('f1', encrypted, {
      Plaintext: MOCK_DECRYPT_DK_RESPONSE.Plaintext,
    });
    expect(decrypted).to.deep.equal(VALUE2);
  });
  it('should ignore forward compatibility for encrypted stringified array', () => {
    const encrypted = encryptValue('f1', [VALUE], {
      Plaintext: MOCK_GEN_DK_RESPONSE.Plaintext,
    });
    const decrypted = decryptValue('f1', encrypted, {
      Plaintext: MOCK_DECRYPT_DK_RESPONSE.Plaintext,
    });
    expect(decrypted).to.deep.equal([VALUE]);
  });

  describe('aes feature flag', () => {
    afterEach(Sinon.restore);

    it('should handle 0', () => {
      const encrypted = crypto.encrypt(VALUE, undefined, 0).toString();
      const decrypted = crypto.decrypt(encrypted, undefined, 0);
      expect(decrypted).to.equal(VALUE);
    });
    it('should handle empty string', () => {
      const encrypted = crypto.encrypt(VALUE, undefined, '').toString();
      const decrypted = crypto.decrypt(encrypted, undefined, '');
      expect(decrypted).to.equal(VALUE);
    });
    it('should handle "false"', () => {
      const encrypted = crypto.encrypt(VALUE, undefined, 'false').toString();
      const decrypted = crypto.decrypt(encrypted, undefined, 'false');
      expect(decrypted).to.equal(VALUE);
    });
    it('should handle false', () => {
      const encrypted = crypto.encrypt(VALUE, undefined, false).toString();
      const decrypted = crypto.decrypt(encrypted, undefined, false);
      expect(decrypted).to.equal(VALUE);
    });
    it('should handle null', () => {
      const encrypted = crypto.encrypt(VALUE, undefined, null).toString();
      const decrypted = crypto.decrypt(encrypted, undefined, null);
      expect(decrypted).to.equal(VALUE);
    });
    it('should handle undefined', () => {
      const encrypted = crypto.encrypt(VALUE, undefined, undefined).toString();
      const decrypted = crypto.decrypt(encrypted, undefined, undefined);
      expect(decrypted).to.equal(VALUE);
    });
  });

  describe('getClientLogger()', () => {
    afterEach(Sinon.restore);

    it('should replace newlines', () => {
      const dbg = Sinon.spy();

      const logger = getClientLogger(dbg);
      logger.info('Multi\nline\ntest.');

      expect(dbg).to.have.been.calledWith('Multi\rline\rtest.');
    });

    it('should print json with max depth', () => {
      const dbg = Sinon.spy();

      const logger = getClientLogger(dbg);
      logger.info({ this: { is: { a: { test: { tooDeep: true } } } } });

      expect(dbg).to.have.been.calledWith('{\r  this: { is: { a: { test: [Object] } } }\r}');
    });

    it('should only ignore client debug messages', () => {
      const dbg = Sinon.spy();
      const logger = getClientLogger(dbg);

      logger.debug('test1');
      logger.info('test2');
      logger.warn('test3');
      logger.error('test4');

      expect(dbg).to.not.have.been.calledWith('test1');
      expect(dbg).to.have.been.calledWith('test2');
      expect(dbg).to.have.been.calledWith('test3');
      expect(dbg).to.have.been.calledWith('test4');
    });
  });
});
