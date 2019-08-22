export const debug = require('debug')('kms');

const CryptoJS = require('crypto-js');

const stringify = value => (typeof value !== 'string' ? JSON.stringify(value) : /* istanbul ignore next */ value);
const parse = (value) => {
  /* istanbul ignore else */
  if (value) {
    try {
      return JSON.parse(value);
    } catch (e) /* istanbul ignore next */ {
      // this will handle when the encrypted value was not stringified
      return value;
    }
  } else {
    return value;
  }
};

export const encryptValue = (key, value, dek) => {
  /* istanbul ignore if */
  if (value === null) {
    return value;
  } else {
    let encryptedValue;
    try {
      encryptedValue = CryptoJS.AES.encrypt(stringify(value), dek.Plaintext.toString());
      return encryptedValue.toString();
    } catch (err) /* istanbul ignore next */ {
      throw new Error(`${err.message}, Field: ${key}, Value: ${value}, Encrypted Value: ${encryptedValue}`);
    }
  }
};

export const decryptValue = (key, value, dek) => {
  /* istanbul ignore if */
  if (value === null) {
    return value;
  } else {
    let decryptedValue;
    try {
      decryptedValue = CryptoJS.AES.decrypt(value, dek.Plaintext.toString());
      return parse(decryptedValue.toString(CryptoJS.enc.Utf8));
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
