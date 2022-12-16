import { loadTokenizer } from './tokenizer';
import { getCDN, logger } from '../utils';

export interface BertInput {
  inputIds: number[];
  inputMask: number[];
  segmentIds: number[];
  labels?: number[];
}

export default class BertModel {
  private readonly inputSize: number;
  private tf = (window as any)['tf'];
  private _modelType = 'bert_small';
  private _outputSize = 0;
  private _meanPooling = false;
  private bertModel?: any; //?: tf.GraphModel;
  private tokenizer?: any; //?: BertTokenizer;
  private _classifierModel?: any; //?: tf.LayersModel;
  private model?: any; //?: tf.Sequential;
  private isMultilingual = false;
  private isDistilBert = false;

  set modelType(type: string) {
    this._modelType = type;
    this.isMultilingual = type.includes('multi');
    this.isDistilBert = type.includes('dbert');
  }
  get modelType() {
    return this._modelType;
  }
  get outputSize(): number {
    return this._outputSize;
  }
  set outputSize(value: number) {
    this._outputSize = value;
  }
  get meanPooling(): boolean {
    return this._meanPooling;
  }

  set meanPooling(value: boolean) {
    this._meanPooling = value;
  }

  constructor(inputSize: number, private kbPath: string) {
    this.inputSize = inputSize;
  }

  async loadModelDefinition(headers: { [key: string]: string }) {
    const modelTypeUrl = `${this.kbPath}/train/classifier/model/json_models/nuclia.json`;
    return fetch(modelTypeUrl, { headers });
  }

  async setup(headers: { [key: string]: string }) {
    const setupCalls: Promise<void>[] = [];

    if (!this.model) {
      setupCalls.push(this.loadBertModel());
    }
    if (!this._classifierModel) {
      setupCalls.push(this.loadClassifierModel(headers));
    }

    if (!this.tokenizer) {
      setupCalls.push(this.loadTokenizer());
    }

    try {
      await Promise.all(setupCalls);
    } catch (e) {
      console.error(`Setup error:`, e);
    }
  }

  async predict(inputText: string): Promise<number[]> {
    const processedInput = this.preprocess(inputText);
    const predictions = await this.batchPredict([processedInput]);
    logger("Predictions:");
    logger(predictions[0]);
    return predictions[0];
  }

  private preprocess(input: string): BertInput {
    const processedInputs = this.batchPreprocess([input]);
    return processedInputs[0];
  }
  private doMeanPooling(attention_mask: any, model_output: any) {
    const inputMaskExpanded = this.tf.cast(
      this.tf.tile(this.tf.expandDims(attention_mask, -1), [1, 1, model_output.shape[2]]),
      "float32",
    );

    const numerador = this.tf.sum(this.tf.mul(model_output, inputMaskExpanded), 1);
    const denominador = this.tf.maximum(this.tf.sum(inputMaskExpanded, 1), 1e-9);
    return this.tf.div(numerador, denominador); //as tf.Tensor2D;
  }

  // Preprocess dataset
  private batchPreprocess(inputs: string[], inputLabels?: number[][]): BertInput[] {
    if (!this.tokenizer) {
      throw new Error('Tokenizer is undefined');
    }
    const tokenizedInputs = inputs.map((input) => this.tokenizer!.encodeText(input, this.inputSize));
    logger('tokenizedInputs', tokenizedInputs);

    return tokenizedInputs.map((tokenized, index) => {
      const bertInput: BertInput = {
        inputIds: tokenized.inputIds,
        inputMask: tokenized.inputMask,
        segmentIds: tokenized.segmentIds,
        labels: inputLabels?.[index],
      };
      return bertInput;
    });
  }

  private async batchPredict(inputs: BertInput[]): Promise<number[][]> {
    if (!this._classifierModel) {
      throw new Error('classifierModel is undefined');
    }
    const bertOutput = this.meanPooling
      ? await this.DistilbertSELayerInference(inputs)
      : this.isDistilBert
        ? await this.DistilbertLayerInference(inputs)
        : await this.bertLayerInference(inputs);
    const x = this.meanPooling
      ? this.tf.tensor2d(bertOutput, [inputs.length, this.outputSize], 'float32')
      : this.tf.tensor2d(bertOutput, [inputs.length, this.inputSize * this.outputSize], 'float32');
    const predTensor = this._classifierModel.predict(x); // as tf.Tensor2D;
    return await predTensor.array();
  }

  // Get raw results from bert layer
  private async bertLayerInference(inputs: BertInput[]) {
    const batchSize = inputs.length;
    const inputIds = inputs.map((value) => value.inputIds);
    const segmentIds = inputs.map((value) => value.segmentIds);
    const inputMask = inputs.map((value) => value.inputMask);

    const rawResult = this.tf.tidy(() => {
      if (!this.bertModel) {
        throw new Error('bertModel is undefined');
      }
      const tfInputIds = this.tf.tensor2d(inputIds, [batchSize, this.inputSize], 'int32');
      const tfSegmentIds = this.tf.tensor2d(segmentIds, [batchSize, this.inputSize], 'int32');
      const tfInputMask = this.tf.tensor2d(inputMask, [batchSize, this.inputSize], 'int32');
      return this.bertModel.execute({
        input_ids: tfInputIds,
        token_type_ids: tfSegmentIds,
        attention_mask: tfInputMask,
      });
    }); // as tf.Tensor2D;
    const bertOutput = await rawResult.array();
    rawResult.dispose();

    return bertOutput;
  }

  // Get raw results from Distilbert layer
  private async DistilbertLayerInference(inputs: BertInput[]) {
    const batchSize = inputs.length;
    const inputIds = inputs.map((value) => value.inputIds);
    const inputMask = inputs.map((value) => value.inputMask);

    const rawResult = this.tf.tidy(() => {
      if (!this.bertModel) {
        throw new Error('DistilbertModel is undefined');
      }
      const tfInputIds = this.tf.tensor2d(inputIds, [batchSize, this.inputSize], 'int32');
      const tfInputMask = this.tf.tensor2d(inputMask, [batchSize, this.inputSize], 'int32');
      return this.bertModel.execute({
        input_ids: tfInputIds,
        attention_mask: tfInputMask,
      });
    }); // as tf.Tensor2D;
    const bertOutput = await rawResult.array();
    rawResult.dispose();

    return bertOutput;
  }

  // Get raw results from Distilbert layer for sentence embeddings 
  private async DistilbertSELayerInference(inputs: BertInput[]) {
    const batchSize = inputs.length;
    const inputIds = inputs.map((value) => value.inputIds);
    const inputMask = inputs.map((value) => value.inputMask);
    const tfInputIds = this.tf.tensor2d(inputIds, [batchSize, this.inputSize], 'int32');
    const tfInputMask = this.tf.tensor2d(inputMask, [batchSize, this.inputSize], 'int32');

    const rawResult = this.tf.tidy(() => {
      return this.bertModel.execute({
        input_ids: tfInputIds,
        attention_mask: tfInputMask
      });
    }); //as tf.Tensor3D;
    logger("Raw Output")
    logger(rawResult)
    const meanPoolingOutput = this.doMeanPooling(tfInputMask, rawResult)
    logger("Mean Pooling Output")
    const bertOutput = await meanPoolingOutput.array();
    logger(bertOutput);
    meanPoolingOutput.dispose();
    return bertOutput;
  }

  // Load converted bert model
  private async loadClassifierModel(headers: { [key: string]: string }) {
    const options = { requestInit: { headers } };
    this._classifierModel = await this.tf.loadLayersModel(
      `${this.kbPath}/train/classifier/model/json_models/model.json`,
      options,
    );
    this._classifierModel.summary();
    await this.predict('Model warmup');
  }

  private async loadBertModel() {
    this.bertModel = await this.tf.loadGraphModel(`${getCDN()}models/classifier/${this.modelType}/model.json`);
  }

  // Load tokenizer for bert input
  private async loadTokenizer() {
    this.tokenizer = await loadTokenizer(
      `${getCDN()}models/classifier/${this.modelType}/vocab.json`,
      !this.isDistilBert,
      this.isMultilingual,
    );
  }
}
