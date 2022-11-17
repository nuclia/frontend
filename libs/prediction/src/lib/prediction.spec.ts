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

    it('should run with tensorflow 3.15.0', () => {
      const prediction = new NucliaPrediction('/');
      expect(prediction.tfVersion).toBe('3.15.0');
    });

    it('should inject tensorflow scripts', () => {
      const prediction = new NucliaPrediction('/');
      expect((NucliaPrediction.prototype as any).injectScript).toHaveBeenCalledTimes(2);
      expect((NucliaPrediction.prototype as any).injectScript).nthCalledWith(
        1,
        `tfjs@${prediction.tfVersion}`,
        `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@${prediction.tfVersion}/dist/tf.min.js`,
        expect.anything(),
      );
      expect((NucliaPrediction.prototype as any).injectScript).nthCalledWith(
        2,
        `tfjs-converter@${prediction.tfVersion}`,
        `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter@${prediction.tfVersion}/dist/tf-converter.min.js`,
        expect.anything(),
      );
    });
  });
});
