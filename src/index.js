import { cloneDeepWith, merge, compact, first } from 'lodash';

import Connector from './connector';
import { encryptValue, decryptValue, logError } from './utils';

export const encryptObject = (object, {
  masterKeyAlias, fields, dataKeys, regions,
}) => new Connector(masterKeyAlias)
  .generateDataKey()
  .then(encryptDataKeyPerRegion({ masterKeyAlias, dataKeys, regions }))
  .then(dataKey =>
    ({
      encrypted: cloneDeepWith(object, (value, key) => {
        if (fields.includes(key)) {
          return encryptValue(key, value, dataKey);
        } else {
          return undefined;
        }
      }),
      metadata: {
        dataKeys: dataKey.dataKeys,
        masterKeyAlias,
        fields,
      },
    }));

export const decryptObject = (object, metadata) =>
  decryptDataKey(metadata)
    .then(dataKey =>
      ({
        object: cloneDeepWith(object, (value, key) => {
          if (metadata.fields.includes(key)) {
            return decryptValue(key, value, dataKey);
          } else {
            return undefined;
          }
        }),
        metadata,
      }));

const encryptDataKeyPerRegion = metadata => ({ Plaintext, CiphertextBlob }) =>
  Promise.all(otherRegions(metadata)
    .map(region => new Connector(metadata.masterKeyAlias, region)
      .encryptDataKey(Plaintext)
      .then(resp => ({
        [region]: resp.CiphertextBlob.toString('base64'),
      }))
      .catch((err) => {
        logError(err, 1, region);
        return {
          [region]: undefined,
        };
      }))
    .concat({
      [process.env.AWS_REGION]: CiphertextBlob.toString('base64'),
    }))
    .then(dataKeys => ({
      dataKeys: merge({}, ...dataKeys),
      Plaintext,
    }));

const decryptDataKey = metadata => new Connector(metadata.masterKeyAlias)
  .decryptDataKey(metadata.dataKeys[process.env.AWS_REGION])
  .catch((e1) => {
    logError(e1, 0, process.env.AWS_REGION);
    return Promise.all(otherRegions(metadata)
      .map(region => new Connector(metadata.masterKeyAlias, region)
        .decryptDataKey(metadata.dataKeys[region])
        .catch((e2) => {
          logError(e2, 0, region);
          return undefined;
        })))
      .then(dataKey => (first(compact(dataKey)) ||
        Promise.reject(new Error('could not decrypt data key from any region'))));
  });

const otherRegions = metadata =>
  (metadata.regions || (metadata.dataKeys && Object.keys(metadata.dataKeys)) || [])
    .filter(region => region !== process.env.AWS_REGION);
