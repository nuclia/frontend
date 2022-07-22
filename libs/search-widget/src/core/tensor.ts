import { from, map, of, Subject, switchMap, switchMapTo } from 'rxjs';

let encoder: any;
let model: any;
let labels: { [key: string]: string } = {};

export const loadModel = (modelPath: string, labelsPath: string) => {
  fetch(labelsPath)
    .then((res) => res.json())
    .then((res) => (labels = res));
  injectDependencies().subscribe(() => {
    (window as any)['use']
      .load()
      .then((enc: any) => {
        encoder = enc;
        return (window as any)['tf'].loadLayersModel(modelPath);
      })
      .then((m: any) => {
        model = m;
        console.log(model, encoder);
      });
  });
};

export const predict = (text: string) => {
  if (!encoder || !model) {
    return of([]);
  }
  return from(encoder.embed([text])).pipe(
    map((encodings) => model.predict(encodings)),
    switchMap((predictions: any) => from(predictions.array())),
    map((predictions: number[][]) => predictions[0].map((score, i) => ({ score, label: labels[`${i}`] || 'Unknown' }))),
  );
};

const injectDependencies = () => {
  const isInit: Subject<boolean> = new Subject();
  injectScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs', () =>
    injectScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/universal-sentence-encoder', () => isInit.next(true)),
  );

  return isInit.asObservable();
};

const injectScript = (url: string, callback: () => void) => {
  const script = window.document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.defer = true;
  script.src = url;
  script.onload = () => {
    console.log('injected', url);
    callback();
  };
  window.document.body.appendChild(script);
};
