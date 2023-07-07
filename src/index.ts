import type { KMS } from '@aws-sdk/client-kms';
import base64url from 'base64url';
import jwt from 'jsonwebtoken';

import timespan from './timespan';
import { Cache, assert } from './utils';

// TODO: Support for other JWT payload types (string & buffer)
type JwtPayload = { [key: string]: any };

export type KmsAsymSignOptions = Omit<jwt.SignOptions, 'encoding'> & {
  /**
   * The signing algorithm used in the KMS instance
   * @default "RSASSA_PSS_SHA_512"
   */
  signingAlgorithm?: string;
}

let kms: KMS;

export const setKmsInstance = (instance: KMS) => kms = instance;

const publicCertificateCache = new Cache(async (KeyId) => {
  const publicKey = await kms.getPublicKey({ KeyId });

  if (!publicKey.PublicKey) {
    throw new Error('No Public Key');
  }

  const pubKey = Buffer.from(publicKey.PublicKey!).toString('base64');

  const certificate = ['-----BEGIN PUBLIC KEY-----', pubKey, '-----END PUBLIC KEY-----'].join('\n');
  return certificate;
});


const optionsToPayload = {
  audience: 'aud',
  issuer: 'iss',
  subject: 'sub',
  jwtid: 'jti',
};


export async function sign(payload: JwtPayload, secretKeyId: string, options: KmsAsymSignOptions = {}) {
  // Ensure the consumer has configured KMS before proceeding
  assert(kms !== undefined, 'KMS instance not configured. Call setKmsInstance before signing');

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

  const res = await kms.sign({
    Message: Buffer.from(`${token_components.header}.${token_components.payload}`),
    KeyId: secretKeyId,
    SigningAlgorithm: options.signingAlgorithm || 'RSASSA_PSS_SHA_512',
    MessageType: 'RAW',
  });

  token_components.signature = Buffer.from(res.Signature!)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return [token_components.header, token_components.payload, token_components.signature].join('.');
}

export async function verify(token: string, secretKeyId: string, options?: jwt.VerifyOptions) {
  assert(kms !== undefined, 'KMS instance not configured. Call setKmsInstance before signing');

  const certificate = await publicCertificateCache.getValue(secretKeyId);
  return jwt.verify(token, certificate, options);
};

// This is just exported for verbosity sake - The very nature of decode is that it isn't verifying the signature
export async function decode(token: string, options?: jwt.DecodeOptions) {
  return jwt.decode(token, options);
}