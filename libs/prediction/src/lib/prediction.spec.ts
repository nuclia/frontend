import { NucliaPrediction } from './prediction';
import { getCDN } from './utils';

describe('NucliaPrediction', () => {
  beforeEach(() => {
    jest.spyOn(NucliaPrediction.prototype as any, 'injectScript').mockImplementation((...args) => {
      if (typeof args[2] === 'function') {
        args[2]();
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should setup CDN', () => {
      expect(getCDN()).toEqual('https://cdn.nuclia.cloud/');
      const cdn = '/';
      new NucliaPrediction(cdn);
      expect(getCDN()).toEqual(cdn);
    });

    it('should inject onnxruntime-web script', () => {
      const prediction = new NucliaPrediction('/');
      expect((NucliaPrediction.prototype as any).injectScript).toHaveBeenCalledTimes(1);
      expect((NucliaPrediction.prototype as any).injectScript).toHaveBeenCalledWith(
        `onnxruntime-web`,
        `https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js`,
        expect.any(Function),
      );
    });
  });
});
