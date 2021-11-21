export class Cache<T extends unknown> {
  private cache: { [key: string]: Promise<T> };

  constructor(private fetcher: (key: string) => Promise<T>) {
    this.cache = {};
  }

  public async getValue(val: string): Promise<T> {
    if (!(val in this.cache)) {
      this.cache[val] = this.fetcher(val);
    }

    return this.cache[val];
  }
}

export function assert(condition: boolean, errorMessage: string) {
  if (!condition) {
    throw new Error(errorMessage);
  }
}
