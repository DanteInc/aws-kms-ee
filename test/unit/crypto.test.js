import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { Readable } from 'stream';

import crypto from 'crypto';

import {
  createCipheriv, createDecipheriv,
  encrypt2, decrypt2,
} from '../../src/crypto';

describe('crypto.js', () => {
  afterEach(sinon.restore);

  it('should encrypt and decrypt - sync', async () => {
    const algorithm = 'AES/CBC/PKCS5Padding';
    const dataKey = crypto.randomBytes(32);
    const data = 'this is only a test';

    const encrypted = encrypt2({
      data: Buffer.from(data),
      algorithm,
      dataKey,
    });
    // console.log({ encrypted });

    const decrypted = decrypt2(encrypted);
    // console.log({ decrypted });

    expect(data).to.equal(decrypted.toString());
  });

  it('should encrypt and decrypt - stream', async () => {
    const algorithm = 'AES/CBC/PKCS5Padding';
    const dataKey = crypto.randomBytes(32);
    const data = 'this is only a test';
    const stream = Readable.from(Buffer.from(data));

    const encryptor = createCipheriv({
      algorithm,
      dataKey,
    });
    // console.log({ encryptor });
    const decipher = createDecipheriv(encryptor);
    // console.log({ decrypted });

    let decrypted = '';
    stream
      .pipe(encryptor.cipher)
      .pipe(decipher)
      .on('data', (chunk) => {
        // console.log(chunk.toString());
        decrypted += chunk;
      })
      .on('end', () => {
        // console.log(decrypted);
        expect(data).to.equal(decrypted);
      })
      .on('error', (err) => {
        console.log(err.stack);
        throw err;
      });
  });
});
