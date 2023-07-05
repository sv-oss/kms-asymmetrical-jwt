# kms-asymmetrical-jwt

kms-asymmetrical-jwt is a small package for creating & validating JWT's from AWS KMS using an asymmetrical signing algorithm.

The exported methods follow identical signature's to the existing 'jsonwebtoken' package, to allow for an easy upgrade path.

## Installation

```
yarn add @sv-oss/kms-asymmetrical-jwt

// or...

npm i @sv-oss/kms-asymmetrical-jwt
```

## Usage

`kms-asymmetrical-jwt` is made to be a drop-in replacement for jsonwebtoken. However, there are some key differences for upgrading.

**You need to configure the KMS client before doing any signing/verifying**

Example:

```ts
import { setKmsInstance, sign, verify } from '@sv-oss/kms-asymmetrical-jwt';
import { KMS } from '@aws-sdk/kms-client';

const kms = new KMS({ region: 'ap-southeast-2' }); // your options are kept

// You only need to do this once.
setKmsInstance(kms);

async function handler() {
    const jwt = await sign({ myPayload: 'hello world' }, 'my-kms-key-id');

    // Somewhere else in your flow
    const payload = await verify(jwt, 'my-kms-id');
    console.log(payload); // { myPayload: 'hello world' } as well as the iat, etc
}
```

The other key difference between this & `jsonwebtoken` is that the second param, instead of taking a signature, takes a KMS KeyId.
