import * as crypto from './crypto';

export const debug = require('debug')('kms');

const parse = (value) => {
  /* istanbul ignore else */
  if (value) {
    if (!(value.startsWith('"') && value.endsWith('"')) && value.split('E').length === 2) {
      // forwards compatibility for previousy non-stringified strings that look exponential
      return value;
    } else {
      return JSON.parse(value);
    }
  } else {
    return value;
  }
};

export const encryptValue = (key, value, dek, AES = true) => {
  /* istanbul ignore if */
  if (value === null) {
    return value;
  } else {
    let encryptedValue;
    try {
      encryptedValue = crypto.encrypt(JSON.stringify(value), dek.Plaintext.toString(), AES);
      return encryptedValue.toString();
    } catch (err) /* istanbul ignore next */ {
      throw new Error(`${err.message}, Field: ${key}, Value: ${value}, Encrypted Value: ${encryptedValue}`);
    }
  }
};

export const decryptValue = (key, value, dek, AES = true) => {
  /* istanbul ignore if */
  if (value === null) {
    return value;
  } else {
    let decryptedValue;
    try {
      decryptedValue = crypto.decrypt(value, dek.Plaintext.toString(), AES);
      return parse(decryptedValue);
    } catch (err) /* istanbul ignore next */ {
      throw new Error(`${err.message}, Field: ${key}, Value: ${value}, Decrypted Value: ${decryptedValue}`);
    }
  }
};

export const logError = (err, forEncrypt, region) => {
  console.error(JSON.stringify({
    message: `could not ${forEncrypt ? 'encrypt' : 'decrypt'} data key for region: ${region}`,
    errorMessage: err.message,
    errorType: err.name,
    stackTrace: err.stack,
  }));

  const tags = {
    account: process.env.ACCOUNT_NAME,
    region: process.env.AWS_REGION,
    functionname: process.env.AWS_LAMBDA_FUNCTION_NAME,
    stage: process.env.SERVERLESS_STAGE,
    service: process.env.SERVERLESS_PROJECT,
    apiname: `${process.env.SERVERLESS_STAGE}-${process.env.SERVERLESS_PROJECT}`,
    memorysize: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE,
    type: err.name,
  };

  const flattenedTags = Object.keys(tags).reduce(
    (t, key) => {
      if (tags[key]) t.push(`${key}:${tags[key]}`);
      return t;
    },
    [],
  ).join(',');

  const timestamp = Math.floor(Date.now() / 1000); // unix format

  return `MONITORING|${timestamp}|1|count|kms.error.count|#${flattenedTags}`;
};
