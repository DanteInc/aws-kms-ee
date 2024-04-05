/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
import Promise from 'bluebird';
import memoryCache from 'memory-cache';
import { DecryptCommand, EncryptCommand, GenerateDataKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { getClientLogger } from './utils';

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
    this.kms = new KMSClient({
      requestHandler: new NodeHttpHandler({
        requestTimeout: timeout,
        connectionTimeout: connectTimeout,
      }),
      logger: getClientLogger(),
      region,
    });
  }

  generateDataKey() {
    return this.getput('datakey', () =>
      this._sendCommand(new GenerateDataKeyCommand({
        KeyId: this.masterKeyAlias,
        KeySpec: 'AES_256',
      }))
        .then(response => ({
          ...response,
          // maintaining backwards compatibility with sdk v2
          CiphertextBlob: Buffer.from(response.CiphertextBlob),
          Plaintext: Buffer.from(response.Plaintext),
        })));
  }

  decryptDataKey(dataKey) {
    return this.getput(dataKey, dk =>
      this._sendCommand(new DecryptCommand({
        CiphertextBlob: Buffer.from(dk, 'base64'),
      }))
        .then(response => ({
          ...response,
          // maintaining backwards compatibility with sdk v2
          Plaintext: Buffer.from(response.Plaintext),
        })));
  }

  encryptDataKey(plainText) {
    return this.getput(plainText, pt =>
      this._sendCommand(new EncryptCommand({
        KeyId: this.masterKeyAlias,
        Plaintext: pt,
      }))
        .then(response => ({
          ...response,
          // maintaining backwards compatibility with sdk v2
          CiphertextBlob: Buffer.from(response.CiphertextBlob),
        })));
  }

  async getput(data, f) {
    let k = cache.get(data);
    if (!k) {
      k = await f(data);
      cache.put(data, k, this.maxAge);
    }
    return Promise.resolve(k);
  }

  _sendCommand(command) {
    // Wrap in bluebird promise for things like tap and tapCatch downstream.
    return Promise.resolve(this.kms.send(command));
  }
}

export default Connector;
