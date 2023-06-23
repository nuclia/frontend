import type { Observable } from 'rxjs';
import { Subject, filter, map } from 'rxjs';
import type { IEvents } from './models';

export class Events implements IEvents {
  private messages = new Subject<{ name: string; data: any }>();

  emit<T>(eventName: string, data: T): void {
    this.messages.next({ name: eventName, data });
  }

  on<T>(eventName: string): Observable<T> {
    return this.messages.asObservable().pipe(
      filter((message) => message.name === eventName),
      map((message) => message.data as T),
    );
  }
}
