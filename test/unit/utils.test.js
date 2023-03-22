import 'mocha';
import { expect } from 'chai';

import { encryptValue, decryptValue } from '../../src/utils';
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
});
