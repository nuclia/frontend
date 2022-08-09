import { from, map, of, Subject, switchMap } from 'rxjs';

let encoder: any;
let model: any;
let labels: { [key: string]: string } = {};

export const loadModel = (modelPath: string, labelsPath: string, headers: { [key: string]: string }) => {
  fetch(labelsPath, { headers }).then((res) => {
    if (res.ok) {
      res.json().then((res) => (labels = res));
    } else {
      console.info('No trained labels in knowledge box');
    }
  });
  injectDependencies().subscribe(() => {
    (window as any)['use']
      .load()
      .then((enc: any) => {
        encoder = enc;
        const options = { requestInit: { headers } };
        return (window as any)['tf'].loadLayersModel((window as any)['tf'].io.http(modelPath, options));
      })
      .then(
        (m: any) => (model = m),
        () => console.info('No trained model in knowledge box'),
      );
  });
};

export const predict = (text: string) => {
  if (!encoder || !model) {
    return of([]);
  }
  return from(encoder.embed([text])).pipe(
    map((encodings) => model.predict(encodings)),
    switchMap((predictions: any) => from(predictions.array())),
    map((predictions: any) =>
      (predictions as number[][])[0]
        .map((score, i) => ({ score, label: labels[`${i}`] || 'Unknown' }))
        .filter((result) => result.score > 0.5)
        .sort((a, b) => b.score - a.score)
        .map((result) => result.label),
    ),
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
  script.onload = callback;
  window.document.body.appendChild(script);
};
