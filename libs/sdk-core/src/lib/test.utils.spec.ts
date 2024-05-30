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

export const multiMockFetch = (responses: { [url: string]: any }) => {
  global.fetch = jest.fn((url: string) => {
    const response = responses[url];
    return Promise.resolve({
      status: 200,
      ok: true,
      clone: () => ({
        json: () => Promise.resolve(response),
      }),
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(response),
    });
  }) as jest.Mock;
};

export const mockReadableStream = (rows: string[], counter: { index: number }) => {
  const encoder = new TextEncoder();
  global.fetch = jest.fn(() => {
    return Promise.resolve({
      status: 200,
      ok: true,
      headers: {
        get: (key: string) => (key === 'X-Nuclia-Trace-Id' ? 'my-search-id' : ''),
      },
      body: {
        getReader: () => ({
          read: () => {
            if (counter.index < rows.length) {
              const result = encoder.encode(rows[counter.index]);
              counter.index += 1;
              return Promise.resolve({ done: false, value: result });
            } else {
              return Promise.resolve({ done: true });
            }
          },
        }),
      },
    });
  }) as jest.Mock;
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

describe('Just test utils', () => {
  it.skip('should do nothing', () => {});
});
