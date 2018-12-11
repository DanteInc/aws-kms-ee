export const debug = require('debug')('kms');

const CryptoJS = require('crypto-js');

export const encryptValue = (value, dek) => CryptoJS.AES.encrypt(value, dek.Plaintext.toString()).toString();
export const decryptValue = (value, dek) => CryptoJS.AES.decrypt(value, dek.Plaintext.toString()).toString(CryptoJS.enc.Utf8);

export const logError = (err, region) => {
  console.error(JSON.stringify({
    message: `could not encrypt data key for remote region: ${region}`,
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
