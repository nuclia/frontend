import { NucliaPrediction } from './prediction';

describe('prediction', () => {
  it('should work', () => {
    const prediction = new NucliaPrediction();
    expect(prediction.test).toEqual('prediction');
  });
});
