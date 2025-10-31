import {
  AfterContentChecked,
  AfterContentInit,
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  ContentChildren,
  effect,
  ElementRef,
  HostBinding,
  inject,
  input,
  output,
  QueryList,
  signal,
  ViewChild,
} from '@angular/core';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { NodeState } from '../../workflow.models';
import { ConnectableEntryComponent } from '../connectable-entry/connectable-entry.component';
import { LinkComponent, LinkService } from '../link';

let boxIndex = 0;

@Component({
  selector: 'app-node-box',
  imports: [TranslateModule, PaButtonModule],
  templateUrl: './node-box.component.html',
  styleUrl: './node-box.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeBoxComponent implements AfterContentInit, AfterContentChecked, AfterViewInit {
  protected linkService = inject(LinkService);
  protected unsubscribeAll = new Subject<void>();
  readonly id = `box-${boxIndex++}`;
  linkRef?: ComponentRef<LinkComponent>;
  private pendingFrame?: number;
  private pendingTimeout?: ReturnType<typeof setTimeout>;
  private subscribedEntries = new Set<string>();

  root = input(false, { transform: booleanAttribute });
  nodeTitle = input('');
  origin = input<ConnectableEntryComponent>();
  state = input<NodeState>('default');

  outputClick = output<ConnectableEntryComponent>();
  trashClick = output<void>();

  visible = signal(false);

  @ViewChild('inputElement') inputElement?: ElementRef;
  @ContentChildren(ConnectableEntryComponent) connectableEntries?: QueryList<ConnectableEntryComponent>;

  @HostBinding('class') get stateClass() {
    return this.state();
  }
  @HostBinding('class.is-root') get isRoot() {
    return this.root();
  }
  @HostBinding('attr.data-id') get boxId() {
    return this.id;
  }
  @HostBinding('class.visible') get visibility() {
    return this.visible();
  }

  constructor() {
    effect(() => {
      const entry = this.origin();
      const state = this.state();
      if (!!entry) {
        if (state === 'processed' || state === 'processing') {
          entry.outputElement.nativeElement.classList.add('processing');
        } else {
          entry.outputElement.nativeElement.classList.remove('processing');
        }
      }
    });
  }

  ngAfterContentInit(): void {
    this.subscribeToEntries();
  }

  ngAfterContentChecked(): void {
    // Re-subscribe to entries in case they were created dynamically
    this.subscribeToEntries();
  }

  private subscribeToEntries(): void {
    if (this.connectableEntries) {
      this.connectableEntries.forEach((entry: ConnectableEntryComponent) => {
        const entryId = entry.id();
        // Check if this entry is already subscribed to avoid duplicate subscriptions
        if (!this.subscribedEntries.has(entryId)) {
          this.subscribedEntries.add(entryId);
          entry.clickOutput.subscribe(() => {
            this.outputClick.emit(entry);
          });
        }
      });
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.visible.set(true);
      this.addLink();
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
    this.cancelScheduledLink();
  }

  updateLink() {
    if (this.linkRef) {
      this.linkService.removeLink(this.linkRef);
    }
    this.addLink();
  }

  removeNode(event: MouseEvent | KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.trashClick.emit();
  }

  private addLink() {
    const entry = this.origin();
    const inputElement = this.inputElement?.nativeElement as HTMLElement | undefined;
    const outputElement = entry?.outputElement.nativeElement as HTMLElement | undefined;

    if (!inputElement || !outputElement) {
      return;
    }

    this.scheduleLinkCreation(() => {
      this.linkRef = this.linkService.drawLink(outputElement, inputElement);
      if (this.linkRef) {
        this.linkRef.setInput('state', this.state());
      }
    });
  }

  private scheduleLinkCreation(callback: () => void) {
    this.cancelScheduledLink();

    if (typeof requestAnimationFrame === 'function') {
      this.pendingFrame = requestAnimationFrame(() => {
        this.pendingFrame = requestAnimationFrame(() => {
          this.pendingFrame = undefined;
          callback();
        });
      });
    } else {
      this.pendingTimeout = setTimeout(() => {
        this.pendingTimeout = undefined;
        callback();
      });
    }
  }

  private cancelScheduledLink() {
    if (this.pendingFrame !== undefined) {
      cancelAnimationFrame(this.pendingFrame);
      this.pendingFrame = undefined;
    }
    if (this.pendingTimeout !== undefined) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = undefined;
    }
  }
}
