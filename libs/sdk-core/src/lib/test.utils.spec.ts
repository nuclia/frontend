// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mockFetch = (response: any) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      status: 200,
      ok: true,
      clone: () => ({
        json: () => Promise.resolve(response),
      }),
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(response),
    }),
  ) as jest.Mock;
};

export class LocalStorageMock {
  store: { [key: string]: string } = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}
global.localStorage = new LocalStorageMock() as unknown as Storage;
global.location = new URL('http://here') as unknown as Location;

describe('Just test utils', () => {
  it.skip('should do nothing', () => {});
});
