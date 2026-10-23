import { Injectable, signal, TemplateRef } from '@angular/core';

@Injectable()
export class DataPageStatusService {
  readonly template = signal<TemplateRef<unknown> | null>(null);
}
