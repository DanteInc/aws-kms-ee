import 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { mockClient } from 'aws-sdk-client-mock';
import { DecryptCommand, EncryptCommand, GenerateDataKeyCommand, KMSClient } from '@aws-sdk/client-kms';

import Connector from '../../src/connector';
import { MOCK_GEN_DK_RESPONSE, MOCK_DECRYPT_DK_RESPONSE, MOCK_ENCRYPT_DK_RESPONSE } from '../../src/fixtures';

describe('connector.js', () => {
  let mockKms;

  beforeEach(() => {
    mockKms = mockClient(KMSClient);
  });

  afterEach(() => {
    mockKms.restore();
  });

  it('should generate a data key', async () => {
    const spy = sinon.spy(() => MOCK_GEN_DK_RESPONSE);
    mockKms.on(GenerateDataKeyCommand).callsFake(spy);

    const response = await new Connector('alias/aws-kms-ee')
      .generateDataKey();

    expect(spy).to.have.been.calledWith({
      KeyId: 'alias/aws-kms-ee',
      KeySpec: 'AES_256',
    });
    expect(response).to.deep.equal(MOCK_GEN_DK_RESPONSE);
  });

  it('should generate a cached data key', async () => {
    const spy = sinon.spy(() => MOCK_GEN_DK_RESPONSE);
    mockKms.on(GenerateDataKeyCommand).callsFake(spy);

    const response = await new Connector('alias/aws-kms-ee')
      .generateDataKey();

    expect(spy).to.have.not.been.calledWith({
      KeyId: 'alias/aws-kms-ee',
      KeySpec: 'AES_256',
    });
    expect(response).to.deep.equal(MOCK_GEN_DK_RESPONSE);
  });

  it('should decrypt a data key', async () => {
    const spy = sinon.spy(() => MOCK_DECRYPT_DK_RESPONSE);
    mockKms.on(DecryptCommand).callsFake(spy);

    const response = await new Connector('alias/aws-kms-ee')
      .decryptDataKey(MOCK_GEN_DK_RESPONSE.CiphertextBlob.toString('base64'));

    expect(spy).to.have.been.calledWith({
      CiphertextBlob: MOCK_GEN_DK_RESPONSE.CiphertextBlob,
    });
    expect(response).to.deep.equal(MOCK_DECRYPT_DK_RESPONSE);
  });

  it('should encrypt a data key', async () => {
    const spy = sinon.spy(() => MOCK_ENCRYPT_DK_RESPONSE);
    mockKms.on(EncryptCommand).callsFake(spy);

    const response = await new Connector('alias/aws-kms-ee', 'us-west-2')
      .encryptDataKey(MOCK_GEN_DK_RESPONSE.Plaintext);

    expect(spy).to.have.been.calledWith({
      KeyId: 'alias/aws-kms-ee',
      Plaintext: MOCK_GEN_DK_RESPONSE.Plaintext,
    });
    expect(response).to.deep.equal(MOCK_ENCRYPT_DK_RESPONSE);
  });
});
