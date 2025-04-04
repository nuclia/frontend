import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  ElementRef,
  HostBinding,
  inject,
  input,
  output,
  QueryList,
  ViewChild,
} from '@angular/core';
import { Subject } from 'rxjs';
import { ConnectableEntryComponent } from '../connectable-entry/connectable-entry.component';
import { LinkService } from '../link';

let boxIndex = 0;

@Component({
  selector: 'app-agent-box',
  imports: [CommonModule],
  templateUrl: './agent-box.component.html',
  styleUrl: './agent-box.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentBoxComponent implements AfterViewInit {
  protected linkService = inject(LinkService);
  protected unsubscribeAll = new Subject<void>();
  readonly id = `box-${boxIndex++}`;

  agent = input(false, { transform: booleanAttribute });
  inputTitle = input('');
  origin = input<ConnectableEntryComponent>();
  state = input<'default' | 'selected' | 'processing' | 'processed'>('default');

  outputClick = output<ConnectableEntryComponent>();

  @ViewChild('inputElement') inputElement?: ElementRef;
  @ContentChildren(ConnectableEntryComponent) connectableEntries?: QueryList<ConnectableEntryComponent>;

  @HostBinding('class') get stateClass() {
    return this.state();
  }
  @HostBinding('class.is-agent') get isAgent() {
    return this.agent();
  }
  @HostBinding('attr.data-id') get boxId() {
    return this.id;
  }

  ngAfterContentInit(): void {
    this.connectableEntries?.forEach((entry: ConnectableEntryComponent) => {
      entry.clickOutput.subscribe(() => this.outputClick.emit(entry));
    });
  }

  ngAfterViewInit(): void {
    const entry = this.origin();
    if (entry && this.inputElement) {
      const leftBox = entry.outputElement.nativeElement.getBoundingClientRect();
      const rightBox = this.inputElement.nativeElement.getBoundingClientRect();
      this.linkService.drawLink(leftBox, rightBox);
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
