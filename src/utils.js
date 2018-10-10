export const debug = require('debug')('kms');

const CryptoJS = require('crypto-js');

export const encryptValue = (value, dek) => CryptoJS.AES.encrypt(value, dek.Plaintext.toString()).toString();
export const decryptValue = (value, dek) => CryptoJS.AES.decrypt(value, dek.Plaintext.toString()).toString(CryptoJS.enc.Utf8);
