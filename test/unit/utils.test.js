import 'mocha';
import { expect } from 'chai';

import { encryptValue, decryptValue } from '../../src/utils';

import { GEN_DK_RESPONSE, DECRYPT_DK_RESPONSE } from '../fixtures';

const VALUE = 'fred';

describe('utils.js', () => {
  it('should encrypt and decrypt', () => {
    const encrypted = encryptValue(VALUE, {
      Plaintext: Buffer.from(GEN_DK_RESPONSE.Plaintext.data),
    });
    // console.log(encrypted);

    const decrypted = decryptValue(encrypted, {
      Plaintext: Buffer.from(DECRYPT_DK_RESPONSE.Plaintext.data),
    });
    expect(decrypted).to.equal(VALUE);
  });
});
