import type { Observable } from 'rxjs';
import { BehaviorSubject, Subject, filter, map } from 'rxjs';
import type { IEvents } from './models';

export class Events implements IEvents {
  // instant messages
  private messages = new Subject<{ name: string; data: any }>();
  // persistent logs
  private logs = new BehaviorSubject<{ [name: string]: any }>({});

  emit<T = any>(eventName: string, data: T): void {
    this.messages.next({ name: eventName, data });
  }

  on<T = any>(eventName: string): Observable<T> {
    return this.messages.asObservable().pipe(
      filter((message) => message.name === eventName),
      map((message) => message.data as T),
    );
  }

  log(eventName: string, data: any): void {
    this.logs.next({ ...this.logs.getValue(), [eventName]: data });
  }

  dump(): Observable<{ [name: string]: any }> {
    return this.logs.asObservable();
  }
}
