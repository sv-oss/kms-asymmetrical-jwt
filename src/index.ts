import type { KMS } from '@aws-sdk/client-kms';
import { KmsClient } from './kms';

export const setKmsInstance = (kms: KMS) => KmsClient.setKmsInstance(kms);

export * from './certificate-cache';
export * from './decode';
export * from './kms';
export * from './sign';
export * from './verify';
