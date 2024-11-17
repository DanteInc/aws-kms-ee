const CryptoJS = require('crypto-js');

// base64 is just for ease of unit testing

const isTrue = v => v !== false && v !== 'false' && v !== 0 && v !== '' && v !== null && v !== undefined;

export const encrypt = (v, k, AES) => (isTrue(AES) ?
  CryptoJS.AES.encrypt(v, k) :
  Buffer.from(v, 'utf-8').toString('base64'));

export const decrypt = (v, k, AES) => (isTrue(AES) ?
  CryptoJS.AES.decrypt(v, k).toString(CryptoJS.enc.Utf8) :
  Buffer.from(v, 'base64').toString('utf-8'));
