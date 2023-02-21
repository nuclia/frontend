import { logger, setCDN, getCDN } from './utils';
import { BertTokenizer, loadTokenizer } from './bert/tokenizer';

import { BehaviorSubject, filter, forkJoin, from, map, Observable, of, switchMap, take, throwError } from 'rxjs';
import type { Classification } from '@nuclia/core';

export class NucliaPrediction {
  options = {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all',
  };
  session: any = undefined;
  labels: string[][] = [];
  isReady = false;
  tokenizer?: BertTokenizer;

  private scriptsInjected = new BehaviorSubject(false);

  constructor(cdn: string) {
    setCDN(cdn);
    this.injectScript(`onnxruntime-web`, `https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js`, () =>
      this.scriptsInjected.next(true),
    );
  }

  loadModels(kbPath: string, headers: { [key: string]: string }) {
    from(this.loadLabelSets(kbPath, headers)).subscribe();

    this.scriptsInjected
      .pipe(
        filter((injected) => injected),
        take(1),
        switchMap(() => from(this.loadModelDefinition(kbPath, headers))),
        switchMap((result) => {
          return result.ok ? from(result.json()) : throwError(() => new Error('Unable to load modelType'));
        }),
        switchMap((definition: { model: string }) => {
          const vocab = `${getCDN()}models/classifier/${definition.model}/vocab.json`;
          const model = `${kbPath}/train/classifier/model/onnx_models/model-int8.onnx`;
          const session = (window.ort as any).InferenceSession.create(model, this.options);
          return forkJoin([from(loadTokenizer(vocab, false, true)), from(session.then((s) => (this.session = s)))]);
        }),
      )
      .subscribe(([tokenizer, session]: [BertTokenizer, any]) => {
        this.tokenizer = tokenizer;
        this.isReady = true;
      });
  }

  predict(query: string): Observable<Classification[]> {
    if (!this.isReady) {
      logger('Model not loaded yet');
      return of([]);
    }
    return from(this.lm_inference(query)).pipe(
      map((results) =>
        results
          .filter((result) => result.score > 0.5)
          .map((result) => {
            const [labelset, label] = result.label.split('/');
            return { labelset, label };
          }),
      ),
    );
  }

  private async lm_inference(text: string): Promise<{ label: string; score: number }[]> {
    const encoded_ids = this.tokenizer.tokenize(text);
    logger(encoded_ids);

    if (encoded_ids.length === 0) {
      return Promise.resolve([]);
    }

    const start = performance.now();
    const model_input = this.create_model_input(encoded_ids);
    const output = await this.session.run(model_input);
    const duration = (performance.now() - start).toFixed(1);

    const result: { label: string; score: number }[] = [];
    for (let i = 0; i < this.labels.length; i++) {
      result[i] = { label: this.labels[i][0], score: output.probabilities.data[i] };
    }
    result.sort((a, b) => {
      if (a.score === b.score) {
        return 0;
      } else {
        return a.score < b.score ? 1 : -1;
      }
    });
    logger('duration', duration);
    logger('result', result);
    return result;
  }

  private create_model_input(encoded: number[]) {
    const input_ids = new Array(encoded.length + 1);
    const attention_mask = new Array(encoded.length + 1);
    const token_type_ids = new Array(encoded.length + 1);
    input_ids[0] = BigInt(101);
    attention_mask[0] = BigInt(1);
    token_type_ids[0] = BigInt(0);
    for (let i = 0; i < encoded.length; i++) {
      input_ids[i + 1] = BigInt(encoded[i]);
      attention_mask[i + 1] = BigInt(1);
      token_type_ids[i + 1] = BigInt(0);
    }
    input_ids[encoded.length] = BigInt(102);
    attention_mask[encoded.length] = BigInt(1);
    token_type_ids[encoded.length] = BigInt(0);
    const sequence_length = input_ids.length;
    const input_ids_tensor = new (window.ort as any).Tensor('int64', BigInt64Array.from(input_ids), [
      1,
      sequence_length,
    ]);
    const attention_mask_tensor = new (window.ort as any).Tensor('int64', BigInt64Array.from(attention_mask), [
      1,
      sequence_length,
    ]);
    const token_type_ids_tensor = new (window.ort as any).Tensor('int64', BigInt64Array.from(token_type_ids), [
      1,
      sequence_length,
    ]);
    return {
      input_ids: input_ids_tensor,
      attention_mask: attention_mask_tensor,
      token_type_ids: token_type_ids_tensor,
    };
  }

  private async loadLabelSets(kbPath: string, headers: { [key: string]: string }) {
    return fetch(`${kbPath}/train/classifier/model/model_files/pos_to_lab.json`, { headers }).then((res) => {
      if (res.ok) {
        res.json().then((res) => (this.labels = res.labels));
      } else {
        console.info('No trained labels in knowledge box');
      }
    });
  }

  private injectScript(id: string, url: string, callback: () => void) {
    if (!document.getElementById(id)) {
      const script = window.document.createElement('script');
      script.id = id;
      script.type = 'text/javascript';
      script.async = true;
      script.defer = true;
      script.src = url;
      script.onload = callback;
      window.document.body.appendChild(script);
    }
  }

  private async loadModelDefinition(kbPath: string, headers: { [key: string]: string }) {
    const modelTypeUrl = `${kbPath}/train/classifier/model/model/nuclia.json`;
    return fetch(modelTypeUrl, { headers });
  }
}
