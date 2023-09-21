import type { KMS } from '@aws-sdk/client-kms';

export class KmsClient {
  public static kms: KMS | null = null;

  public static setKmsInstance(instance: KMS) {
    KmsClient.kms = instance;
  }
}
