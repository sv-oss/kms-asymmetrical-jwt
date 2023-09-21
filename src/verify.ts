import jwt from 'jsonwebtoken';

import { publicCertificateCache } from './certificate-cache';
import { KmsClient } from './kms';
import { assert } from './utils';

export async function verify(token: string, secretKeyId: string, options?: jwt.VerifyOptions) {
  assert(KmsClient.kms !== undefined, 'KMS instance not configured. Call setKmsInstance before signing');

  const certificate = await publicCertificateCache.getValue(secretKeyId);
  return jwt.verify(token, certificate, options);
}
