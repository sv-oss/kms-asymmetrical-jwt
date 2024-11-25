import { createHash } from 'crypto';
import type { SigningAlgorithmSpec } from '@aws-sdk/client-kms';
import base64url from 'base64url';
import type { SignOptions } from 'jsonwebtoken';
import { KmsClient } from './kms';
import timespan from './timespan';
import { assert } from './utils';


const optionsToPayload = {
  audience: 'aud',
  issuer: 'iss',
  subject: 'sub',
  jwtid: 'jti',
};


// TODO: Support for other JWT payload types (string & buffer)
export type JwtPayload = { [key: string]: any };

export type KmsAsymSignOptions = Omit<SignOptions, 'encoding'> & {
  /**
   * The signing algorithm used in the KMS instance
   * @default "RSASSA_PSS_SHA_512"
   */
  signingAlgorithm?: SigningAlgorithmSpec;

  /**
   * The digest algorithm used in KMS
   *
   * Digest is automatically used for messages over 4096 characters long
   *
   * The value should align to your signing algorihtm.
   *
   * If you change signing algorithm, it is recommended you change digestAlgorithm too.
   *
   * @default "sha512" -> This is to align to the signingAlgorithm default.
   */
  digestAlgorithm?: string;
}

export async function sign(payload: JwtPayload, secretKeyId: string, options: KmsAsymSignOptions = {}) {
  // Ensure the consumer has configured KMS before proceeding
  assert(KmsClient.kms !== undefined, 'KMS instance not configured. Call setKmsInstance before signing');

  const header = {
    alg: options.algorithm || 'PS512',
    typ: 'JWT',
    kid: options.keyid,
    ...options.header,
  };

  // Checks air-lifted from node-jsonwebtoken sign.js
  if (typeof payload.exp !== 'undefined' && typeof options.expiresIn !== 'undefined') {
    throw new Error('Bad "options.expiresIn" option the payload already has an "exp" property.');
  }

  if (typeof payload.nbf !== 'undefined' && typeof options.notBefore !== 'undefined') {
    throw new Error('Bad "options.notBefore" option the payload already has an "nbf" property.');
  }

  const timestamp = payload.iat || Math.floor(Date.now() / 1000);

  // Clone the existing payload, with an issuedAt time
  const jwtPayload: { [key: string]: any } = {
    ...payload,
    iat: timestamp,
  };

  if (options.noTimestamp) {
    delete jwtPayload.iat;
  }

  if (typeof options.notBefore !== 'undefined') {
    jwtPayload.nbf = timespan(options.notBefore, timestamp);
  }

  if (typeof options.expiresIn !== 'undefined') {
    jwtPayload.exp = timespan(options.expiresIn, timestamp);
  }

  Object.entries(optionsToPayload).forEach(([key, claim]) => {
    // @ts-ignore
    if (options[key] !== 'undefined') {
      if (typeof payload[claim] !== 'undefined') {
        throw new Error('Bad "options.' + key + '" option. The payload already has an "' + claim + '" property.');
      }

      // @ts-ignore
      jwtPayload[claim] = options[key];
    }
  });

  const token_components: { header: string; payload: string; signature?: string } = {
    header: base64url(JSON.stringify(header)),
    payload: base64url(JSON.stringify(jwtPayload)),
  };

  const rawMessage = `${token_components.header}.${token_components.payload}`;

  const messageType = rawMessage.length > 4096 ? 'DIGEST' : 'RAW';

  const res = await KmsClient.kms!.sign({
    Message: messageType === 'DIGEST' ?
      createHash(options.digestAlgorithm || 'sha512').update(rawMessage).digest() :
      Buffer.from(rawMessage),
    KeyId: secretKeyId,
    SigningAlgorithm: options.signingAlgorithm || 'RSASSA_PSS_SHA_512',
    MessageType: messageType,
  });

  token_components.signature = Buffer.from(res.Signature!)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return [token_components.header, token_components.payload, token_components.signature].join('.');
}
