/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
import { config, KMS } from 'aws-sdk';
import Promise from 'bluebird';
import memoryCache from 'memory-cache';

import { debug } from './utils';

config.setPromisesDependency(Promise);

const cache = new memoryCache.Cache();

class Connector {
  constructor(
    masterKeyAlias,
    region = process.env.AWS_REGION,
    timeout = Number(process.env.KMS_TIMEOUT || process.env.TIMEOUT || 1000),
    connectTimeout = Number(process.env.KMS_CONNECT_TIMEOUT || process.env.CONNECT_TIMEOUT || 1000),
    maxAge = Number(process.env.DATA_KEY_MAX_AGE) || undefined, // default to life of lambda function
  ) {
    this.maxAge = maxAge;
    this.masterKeyAlias = masterKeyAlias;
    this.kms = new KMS({
      httpOptions: { timeout, connectTimeout },
      logger: { log: /* istanbul ignore next */ msg => debug(msg) },
      region,
    });
  }

  generateDataKey() {
    return this.getput('datakey', () =>
      this.kms.generateDataKey({
        KeyId: this.masterKeyAlias,
        KeySpec: 'AES_256',
      }).promise());
  }

  decryptDataKey(dataKey) {
    return this.getput(dataKey, dk =>
      this.kms.decrypt({
        CiphertextBlob: Buffer.from(dk, 'base64'),
      }).promise());
  }

  encryptDataKey(plainText) {
    return this.getput(plainText, pt =>
      this.kms.encrypt({
        KeyId: this.masterKeyAlias,
        Plaintext: pt,
      }).promise());
  }

  async getput(data, f) {
    let k = cache.get(data);
    if (!k) {
      k = await f(data);
      cache.put(data, k, this.maxAge);
    }
    return Promise.resolve(k);
  }
}

export default Connector;
