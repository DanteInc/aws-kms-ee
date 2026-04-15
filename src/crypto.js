import crypto from 'crypto';

// deprecated
const CryptoJS = require('crypto-js');

// base64 is just for ease of unit testing

const isTrue = v => v !== false && v !== 'false' && v !== 0 && v !== '' && v !== null;

export const encrypt = (v, k, AES) => (isTrue(AES) ?
  CryptoJS.AES.encrypt(v, k) :
  Buffer.from(v, 'utf-8').toString('base64'));

export const decrypt = (v, k, AES) => (isTrue(AES) ?
  CryptoJS.AES.decrypt(v, k).toString(CryptoJS.enc.Utf8) :
  Buffer.from(v, 'base64').toString('utf-8'));

// ===============================

// https://stackoverflow.com/questions/44895166/how-to-use-aws-kms-encryption-in-the-node-js-sdk

const algo = (algorithm) => {
  switch (algorithm) {
    case 'AES/CBC/PKCS5Padding':
      return 'aes-256-cbc';
    // istanbul ignore next
    case 'AES/GCM/NoPadding':
      return 'aes-256-gcm';
    // istanbul ignore next
    default:
      throw new Error(`Unsupported algorithm: ${algorithm}`);
  }
};

export const createCipheriv = ({ algorithm, dataKey }) => {
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algo(algorithm), dataKey, iv);

  return {
    cipher,
    iv: iv.toString('base64'),
    algorithm,
    dataKey,
  };
};

export const createDecipheriv = ({ algorithm, dataKey, iv }) =>
  crypto.createDecipheriv(algo(algorithm), dataKey, Buffer.from(iv, 'base64'));

//---------------

export const encrypt2 = ({
  data, // Buffer
  algorithm,
  dataKey,
}) => {
  const c = createCipheriv({ algorithm, dataKey });

  let encrypted = c.cipher.update(data);
  encrypted = Buffer.concat([encrypted, c.cipher.final()]);

  return {
    encrypted,
    ...c,
  };
};

export const decrypt2 = ({
  encrypted, // Buffer
  algorithm,
  dataKey,
  iv,
}) => {
  const decipher = createDecipheriv({ algorithm, dataKey, iv });

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted;
};
