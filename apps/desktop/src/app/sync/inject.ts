import { of, Subject } from 'rxjs';

const INJECTED: string[] = [];

export function injectScript(url: string) {
  if (INJECTED.includes(url)) {
    return of(true);
  } else {
    const isInit: Subject<boolean> = new Subject();
    const script = window.document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.defer = true;
    script.src = url;
    script.onload = () => {
      INJECTED.push(url);
      isInit.next(true);
    };
    script.onerror = () => isInit.next(false);
    window.document.body.appendChild(script);

    return isInit.asObservable();
  }
}
