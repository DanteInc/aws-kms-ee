import 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';

import Connector from '../../src/connector';
import { GEN_DK_RESPONSE, DECRYPT_DK_RESPONSE, ENCRYPT_DK_RESPONSE } from '../fixtures';

const AWS = require('aws-sdk-mock');

AWS.Promise = Promise;

describe('connector.js', () => {
  afterEach(() => {
    AWS.restore('KMS');
  });

  it('should generate a data key', async () => {
    const spy = sinon.spy((params, cb) => cb(null, GEN_DK_RESPONSE));
    AWS.mock('KMS', 'generateDataKey', spy);

    const response = await new Connector('alias/aws-kms-ee')
      .generateDataKey();

    expect(spy).to.have.been.calledWith({
      KeyId: 'alias/aws-kms-ee',
      KeySpec: 'AES_256',
    });
    expect(response).to.deep.equal(GEN_DK_RESPONSE);
  });

  it('should decrypt a data key', async () => {
    const spy = sinon.spy((params, cb) => cb(null, DECRYPT_DK_RESPONSE));
    AWS.mock('KMS', 'decrypt', spy);

    const response = await new Connector('alias/aws-kms-ee')
      .decryptDataKey(GEN_DK_RESPONSE.CiphertextBlob.toString('base64'));

    expect(spy).to.have.been.calledWith({
      CiphertextBlob: GEN_DK_RESPONSE.CiphertextBlob,
    });
    expect(response).to.deep.equal(DECRYPT_DK_RESPONSE);
  });

  it('should encrypt a data key', async () => {
    const spy = sinon.spy((params, cb) => cb(null, ENCRYPT_DK_RESPONSE));
    AWS.mock('KMS', 'encrypt', spy);

    const response = await new Connector('alias/aws-kms-ee', 'us-west-2')
      .encryptDataKey(GEN_DK_RESPONSE.Plaintext);

    expect(spy).to.have.been.calledWith({
      KeyId: 'alias/aws-kms-ee',
      Plaintext: GEN_DK_RESPONSE.Plaintext,
    });
    expect(response).to.deep.equal(ENCRYPT_DK_RESPONSE);
  });
});
