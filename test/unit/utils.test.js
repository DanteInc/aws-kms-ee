import 'mocha';
import { expect } from 'chai';

import { encryptValue, decryptValue } from '../../src/utils';

import { GEN_DK_RESPONSE, DECRYPT_DK_RESPONSE } from '../fixtures';

const VALUE = 'fred';

describe('utils.js', () => {
  it('should encrypt and decrypt', () => {
    const encrypted = encryptValue('f1', VALUE, {
      Plaintext: GEN_DK_RESPONSE.Plaintext,
    });
    // console.log(encrypted);

    const decrypted = decryptValue('f1', encrypted, {
      Plaintext: DECRYPT_DK_RESPONSE.Plaintext,
    });
    expect(decrypted).to.equal(VALUE);
  });
});
