import { KMS } from 'aws-sdk';

import { debug } from './utils';

class Connector {
  constructor(masterKeyAlias) {
    this.masterKeyAlias = masterKeyAlias;
    this.kms = new KMS({
      httpOptions: { timeout: 1000 },
      logger: { log: /* istanbul ignore next */ msg => debug(msg) },
    });
  }

  generateDataKey() {
    return this.kms.generateDataKey({
      KeyId: this.masterKeyAlias,
      KeySpec: 'AES_256',
    }).promise();
  }

  decryptDataKey(dataKey) {
    return this.kms.decrypt({
      CiphertextBlob: Buffer.from(dataKey, 'base64'),
    }).promise();
  }

  encryptDataKey(plainText) {
    return this.kms.encrypt({
      KeyId: this.masterKeyAlias,
      Plaintext: plainText,
    }).promise();
  }
}

export default Connector;
