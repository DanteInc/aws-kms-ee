import * as _ from 'lodash';

import Connector from './connector';
import { encryptValue, decryptValue } from './utils';

export const encryptObject = (object, metadata) => new Connector(metadata.masterKeyAlias)
  .generateDataKey()
  .then(dataKey =>
    ({
      encrypted: _.cloneDeepWith(object, (value, key) => {
        if (metadata.fields.includes(key)) {
          return encryptValue(value, dataKey);
        } else {
          return undefined;
        }
      }),
      metadata: {
        dataKey: {
          [process.env.AWS_REGION]: dataKey.CiphertextBlob.toString('base64'),
        },
        ...metadata,
      },
    }));

export const decryptObject = (object, metadata) => new Connector(metadata.masterKeyAlias)
  .decryptDataKey(metadata.dataKey[process.env.AWS_REGION])
  .then(dataKey =>
    ({
      object: _.cloneDeepWith(object, (value, key) => {
        if (metadata.fields.includes(key)) {
          return decryptValue(value, dataKey);
        } else {
          return undefined;
        }
      }),
      metadata,
    }));

