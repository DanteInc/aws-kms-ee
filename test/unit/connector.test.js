import 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';

import Connector from '../../src/connector';
import { MOCK_GEN_DK_RESPONSE, MOCK_DECRYPT_DK_RESPONSE, MOCK_ENCRYPT_DK_RESPONSE } from '../../src/fixtures';

const AWS = require('aws-sdk-mock');

AWS.Promise = Promise;

describe('connector.js', () => {
  afterEach(() => {
    AWS.restore('KMS');
  });

  it('should generate a data key', async () => {
    const spy = sinon.spy((params, cb) => cb(null, MOCK_GEN_DK_RESPONSE));
    AWS.mock('KMS', 'generateDataKey', spy);

    const response = await new Connector('alias/aws-kms-ee')
      .generateDataKey();

    expect(spy).to.have.been.calledWith({
      KeyId: 'alias/aws-kms-ee',
      KeySpec: 'AES_256',
    });
    expect(response).to.deep.equal(MOCK_GEN_DK_RESPONSE);
  });

  it('should generate a cached data key', async () => {
    const spy = sinon.spy((params, cb) => cb(null, MOCK_GEN_DK_RESPONSE));
    AWS.mock('KMS', 'generateDataKey', spy);

    const response = await new Connector('alias/aws-kms-ee')
      .generateDataKey();

    expect(spy).to.have.not.been.calledWith({
      KeyId: 'alias/aws-kms-ee',
      KeySpec: 'AES_256',
    });
    expect(response).to.deep.equal(MOCK_GEN_DK_RESPONSE);
  });

  it('should decrypt a data key', async () => {
    const spy = sinon.spy((params, cb) => cb(null, MOCK_DECRYPT_DK_RESPONSE));
    AWS.mock('KMS', 'decrypt', spy);

    const response = await new Connector('alias/aws-kms-ee')
      .decryptDataKey(MOCK_GEN_DK_RESPONSE.CiphertextBlob.toString('base64'));

    expect(spy).to.have.been.calledWith({
      CiphertextBlob: MOCK_GEN_DK_RESPONSE.CiphertextBlob,
    });
    expect(response).to.deep.equal(MOCK_DECRYPT_DK_RESPONSE);
  });

  it('should encrypt a data key', async () => {
    const spy = sinon.spy((params, cb) => cb(null, MOCK_ENCRYPT_DK_RESPONSE));
    AWS.mock('KMS', 'encrypt', spy);

    const response = await new Connector('alias/aws-kms-ee', 'us-west-2')
      .encryptDataKey(MOCK_GEN_DK_RESPONSE.Plaintext);

    expect(spy).to.have.been.calledWith({
      KeyId: 'alias/aws-kms-ee',
      Plaintext: MOCK_GEN_DK_RESPONSE.Plaintext,
    });
    expect(response).to.deep.equal(MOCK_ENCRYPT_DK_RESPONSE);
  });
});
