import jwt from 'jsonwebtoken';

// This is just exported for verbosity sake - The very nature of decode is that it isn't verifying the signature
export async function decode(token: string, options?: jwt.DecodeOptions) {
  return jwt.decode(token, options);
}
