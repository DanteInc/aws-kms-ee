import 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';

import { encryptObject, decryptObject } from '../../src';
import Connector from '../../src/connector';

import { DOMAIN_OBJECT, GEN_DK_RESPONSE, DECRYPT_DK_RESPONSE, ENCRYPT_DK_RESPONSE } from '../fixtures';

describe('index.js', () => {
  beforeEach(() => {
    process.env.ACCOUNT_NAME = process.env.ACCOUNT_NAME || 'dev';
    process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should encrypt and decrypt (shallow)', async () => {
    sinon.stub(Connector.prototype, 'generateDataKey')
      .returns(Promise.resolve(GEN_DK_RESPONSE));
    sinon.stub(Connector.prototype, 'decryptDataKey')
      .returns(Promise.resolve(DECRYPT_DK_RESPONSE));

    const encryptOutput = await encryptObject(
      DOMAIN_OBJECT,
      {
        masterKeyAlias: 'alias/aws-kms-ee',
        fields: [
          'f1',
        ],
      },
    );

    // console.log(JSON.stringify(encryptOutput, null, 2));
    expect(encryptOutput.encrypted).to.not.deep.equal(DOMAIN_OBJECT);
    expect(encryptOutput.encrypted.f1).to.not.equal('v1');
    expect(encryptOutput.encrypted.f2).to.equal('v2');
    expect(encryptOutput.metadata.fields).to.exist;

    const decryptOutput = await decryptObject(encryptOutput.encrypted, encryptOutput.metadata);
    // console.log(JSON.stringify(decryptOutput, null, 2));
    expect(decryptOutput.object).to.deep.equal(DOMAIN_OBJECT);
    expect(decryptOutput.metadata.fields).to.exist;
  });

  it('should encrypt and decrypt (deep)', async () => {
    sinon.stub(Connector.prototype, 'generateDataKey')
      .returns(Promise.resolve(GEN_DK_RESPONSE));
    sinon.stub(Connector.prototype, 'decryptDataKey')
      .returns(Promise.resolve(DECRYPT_DK_RESPONSE));

    const encryptOutput = await encryptObject(
      DOMAIN_OBJECT,
      {
        masterKeyAlias: 'alias/aws-kms-ee',
        fields: [
          'f1',
          'f4', // 'f3.f4'
          'f7', // 'f6.f7'
          'f10', // 'f6.f9.f10'
        ],
        dataKeys: {
          'us-east-1': undefined,
        },
      },
    );

    // console.log(JSON.stringify(encryptOutput, null, 2));
    expect(encryptOutput.encrypted).to.not.deep.equal(DOMAIN_OBJECT);
    expect(encryptOutput.encrypted.f1).to.not.equal('v1');
    expect(encryptOutput.encrypted.f3.f4).to.not.equal('v4');
    expect(encryptOutput.encrypted.f3.f5).to.equal('v5');
    expect(encryptOutput.encrypted.f6[0].f7).to.not.equal('v7');
    expect(encryptOutput.encrypted.f6[0].f8).to.equal('v8');
    expect(encryptOutput.encrypted.f6[0].f9.f10).to.not.equal('v10');
    expect(encryptOutput.encrypted.f6[0].f9.f11).to.equal('v11');

    const decryptOutput = await decryptObject(encryptOutput.encrypted, encryptOutput.metadata);
    // console.log(JSON.stringify(decryptOutput, null, 2));
    expect(decryptOutput.object).to.deep.equal(DOMAIN_OBJECT);
  });

  it('should encrypt and decrypt (deeper)', async () => {
    sinon.stub(Connector.prototype, 'generateDataKey')
      .returns(Promise.resolve(GEN_DK_RESPONSE));
    sinon.stub(Connector.prototype, 'decryptDataKey')
      .returns(Promise.resolve(DECRYPT_DK_RESPONSE));

    const encryptOutput = await encryptObject(
      DOMAIN_OBJECT,
      {
        masterKeyAlias: 'alias/aws-kms-ee',
        fields: [
          'f1',
          'f13', // 'f6.f12.f13',
          'f16', // 'f6.f12.f15.f16',
        ],
      },
    );

    // console.log(JSON.stringify(encryptOutput, null, 2));
    expect(encryptOutput.encrypted).to.not.deep.equal(DOMAIN_OBJECT);
    expect(encryptOutput.encrypted.f1).to.not.equal('v1');
    expect(encryptOutput.encrypted.f6[0].f12[0].f13).to.not.equal('v13');
    expect(encryptOutput.encrypted.f6[0].f12[0].f14).to.equal('v14');
    expect(encryptOutput.encrypted.f6[0].f12[0].f15.f16).to.not.equal('v16');
    expect(encryptOutput.encrypted.f6[0].f12[0].f15.f17).to.equal('v17');
    expect(encryptOutput.encrypted.f6[0].f12[0].f15.f1).to.not.equal('v18');

    const decryptOutput = await decryptObject(encryptOutput.encrypted, encryptOutput.metadata);
    // console.log(JSON.stringify(decryptOutput, null, 2));
    expect(decryptOutput.object).to.deep.equal(DOMAIN_OBJECT);
  });

  it('should encrypt and decrypt for multiple regions', async () => {
    sinon.stub(Connector.prototype, 'generateDataKey')
      .returns(Promise.resolve(GEN_DK_RESPONSE));
    sinon.stub(Connector.prototype, 'decryptDataKey')
      .returns(Promise.resolve(DECRYPT_DK_RESPONSE));
    sinon.stub(Connector.prototype, 'encryptDataKey')
      .returns(Promise.resolve(ENCRYPT_DK_RESPONSE));

    const encryptOutput = await encryptObject(
      DOMAIN_OBJECT,
      {
        masterKeyAlias: 'alias/aws-kms-ee',
        regions: ['us-east-1', 'us-west-2'],
        fields: ['f1'],
      },
    );

    // console.log(JSON.stringify(encryptOutput, null, 2));
    expect(encryptOutput.encrypted).to.not.deep.equal(DOMAIN_OBJECT);

    const decryptOutput = await decryptObject(encryptOutput.encrypted, encryptOutput.metadata);
    // console.log(JSON.stringify(decryptOutput, null, 2));
    expect(decryptOutput.object).to.deep.equal(DOMAIN_OBJECT);
    expect(decryptOutput.metadata.fields).to.exist;
    expect(decryptOutput.metadata.dataKeys['us-east-1'])
      .to.equal(GEN_DK_RESPONSE.CiphertextBlob.toString('base64'));
    expect(decryptOutput.metadata.dataKeys['us-west-2'])
      .to.equal(ENCRYPT_DK_RESPONSE.CiphertextBlob.toString('base64'));
  });

  it('should handle other region unable to encrypt data key', async () => {
    sinon.stub(Connector.prototype, 'generateDataKey')
      .returns(Promise.resolve(GEN_DK_RESPONSE));
    sinon.stub(Connector.prototype, 'decryptDataKey')
      .returns(Promise.resolve(DECRYPT_DK_RESPONSE));
    sinon.stub(Connector.prototype, 'encryptDataKey')
      .returns(Promise.reject(new Error('mock cannot encrypt')));

    const stub = sinon.stub(console, 'error');

    const encryptOutput = await encryptObject(
      DOMAIN_OBJECT,
      {
        masterKeyAlias: 'alias/aws-kms-ee',
        regions: ['us-east-1', 'us-west-2'],
        fields: ['f1'],
      },
    );

    // console.log(JSON.stringify(encryptOutput, null, 2));
    expect(encryptOutput.metadata.dataKeys['us-east-1'])
      .to.equal(GEN_DK_RESPONSE.CiphertextBlob.toString('base64'));
    expect(encryptOutput.metadata.dataKeys['us-west-2']).to.be.undefined;
    expect(stub).to.have.been.calledOnce;
  });

  it('should raise error when unable to decrypt data key for any region', async () => {
    sinon.stub(Connector.prototype, 'generateDataKey')
      .returns(Promise.resolve(GEN_DK_RESPONSE));
    sinon.stub(Connector.prototype, 'decryptDataKey')
      .returns(Promise.reject(new Error('mock cannot decrypt')));
    sinon.stub(Connector.prototype, 'encryptDataKey')
      .returns(Promise.resolve(ENCRYPT_DK_RESPONSE));

    const stub = sinon.stub(console, 'error');

    const encryptOutput = await encryptObject(
      DOMAIN_OBJECT,
      {
        masterKeyAlias: 'alias/aws-kms-ee',
        regions: ['us-east-1', 'us-west-2'],
        fields: ['f1'],
      },
    );

    try {
      await decryptObject(encryptOutput.encrypted, encryptOutput.metadata);
      expect.fail('expected error');
    } catch (e) {
      expect(stub).to.have.been.calledTwice;
      console.error('EXPECTED: ', e.message);
    }
  });
});
