import 'mocha';
import { expect } from 'chai';

import { encryptValue, decryptValue } from '../../src/utils';

import { MOCK_GEN_DK_RESPONSE, MOCK_DECRYPT_DK_RESPONSE } from '../../src/fixtures';

const VALUE = 'fred';

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
});
