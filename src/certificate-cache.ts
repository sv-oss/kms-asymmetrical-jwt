import { KmsClient } from './kms';
import { Cache, assert } from './utils';

export const publicCertificateCache = new Cache(async (KeyId) => {
  assert(KmsClient.kms != null, 'KMS instance not configured. Call setKmsInstance before signing');

  const publicKey = await KmsClient.kms!.getPublicKey({ KeyId });

  if (!publicKey.PublicKey) {
    throw new Error('No Public Key');
  }

  const pubKey = Buffer.from(publicKey.PublicKey!).toString('base64');

  const certificate = ['-----BEGIN PUBLIC KEY-----', pubKey, '-----END PUBLIC KEY-----'].join('\n');
  return certificate;
});
