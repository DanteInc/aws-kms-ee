import { KMS } from 'aws-sdk';
import memoizee from 'memoizee';

import { debug } from './utils';

class Connector {
  constructor(masterKeyAlias, region = process.env.AWS_REGION) {
    this.masterKeyAlias = masterKeyAlias;
    this.kms = new KMS({
      httpOptions: { timeout: 1000 },
      logger: { log: /* istanbul ignore next */ msg => debug(msg) },
      region,
    });
  }

  generateDataKey() {
    return this._generateDataKey();
  }

  decryptDataKey(dataKey) {
    return this._decryptDataKey(dataKey);
  }

  encryptDataKey(plainText) {
    return this._encryptDataKey(plainText);
  }

  _generateDataKey = memoizee(
    () =>
      this.kms.generateDataKey({
        KeyId: this.masterKeyAlias,
        KeySpec: 'AES_256',
      }).promise(),
    {
      promise: true,
      maxAge: Number(process.env.DATA_KEY_MAX_AGE) || 1800000, // 30 minutes
    },
  );

  _decryptDataKey = memoizee(
    dataKey =>
      this.kms.decrypt({
        CiphertextBlob: Buffer.from(dataKey, 'base64'),
      }).promise(),
    {
      promise: true,
    },
  );

  _encryptDataKey = memoizee(
    plainText =>
      this.kms.encrypt({
        KeyId: this.masterKeyAlias,
        Plaintext: plainText,
      }).promise(),
    {
      promise: true,
    },
  );
}

export default Connector;
