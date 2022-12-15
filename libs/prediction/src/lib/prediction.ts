import { logger, setCDN } from './utils';
import BertModel from './bert/model';
import { BehaviorSubject, filter, from, map, Observable, of, switchMap, take, tap, throwError } from 'rxjs';
import type { Classification } from '@nuclia/core';

export class NucliaPrediction {
  tfVersion = '3.15.0';
  model?: BertModel;
  labels: string[][] = [];
  isReady = false;

  private scriptsInjected = new BehaviorSubject(false);

  constructor(cdn: string) {
    setCDN(cdn);
    this.injectScript(
      `tfjs@${this.tfVersion}`,
      `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@${this.tfVersion}/dist/tf.min.js`,
      () => {
        this.injectScript(
          `tfjs-converter@${this.tfVersion}`,
          `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter@${this.tfVersion}/dist/tf-converter.min.js`,
          () => this.scriptsInjected.next(true),
        );
      },
    );
  }

  loadModels(kbPath: string, headers: { [key: string]: string }) {
    from(this.loadLabelSets(kbPath, headers)).subscribe();

    this.scriptsInjected
      .pipe(
        filter((injected) => injected),
        take(1),
        switchMap(() => {
          this.model = new BertModel(128, kbPath);
          return from(this.model.loadModelDefinition(headers));
        }),
        switchMap((result) => {
          return result.ok ? from(result.json()) : throwError(() => new Error('Unable to load modelType'));
        }),
        tap((data) => {
          (this.model as BertModel).modelType = data.model;
          (this.model as BertModel).outputSize = data.output_size;
          (this.model as BertModel).meanPooling = data.mean_pooling;
        }),
        switchMap(() => from((this.model as BertModel).setup(headers))),
      )
      .subscribe(() => (this.isReady = true));
  }

  predict(query: string): Observable<Classification[]> {
    if (!this.model || !this.isReady) {
      logger('Model not loaded yet');
      return of([]);
    }
    return from(this.model.predict(query)).pipe(
      map((results) =>
        results
          .map((score: number, index: number) => ({ score, label: this.labels[index][0] }))
          .filter((result) => result.score > 0.5)
          .sort((a, b) => b.score - a.score)
          .map((result) => {
            const [labelset, label] = result.label.split('/');
            return { labelset, label };
          }),
      ),
    );
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
}
