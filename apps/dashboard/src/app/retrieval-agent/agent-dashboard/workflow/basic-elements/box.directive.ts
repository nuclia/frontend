import { booleanAttribute, Directive, inject, input } from '@angular/core';
import { LinkService } from './link';
import { ConnectableEntryComponent } from './connectable-entry/connectable-entry.component';

@Directive({})
export class BoxDirective {
  protected linkService = inject(LinkService);

  agent = input(false, { transform: booleanAttribute });
  inputTitle = input('');
  inputEntry = input<ConnectableEntryComponent>();
  state = input<'default' | 'selected' | 'processing' | 'processed'>('default');
}
