import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  ContentChildren,
  ElementRef,
  HostBinding,
  inject,
  input,
  output,
  QueryList,
  ViewChild,
} from '@angular/core';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { ConnectableEntryComponent } from '../connectable-entry/connectable-entry.component';
import { LinkComponent, LinkService } from '../link';

let boxIndex = 0;

@Component({
  selector: 'app-agent-box',
  imports: [CommonModule, TranslateModule, PaButtonModule],
  templateUrl: './agent-box.component.html',
  styleUrl: './agent-box.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentBoxComponent implements AfterViewInit {
  protected linkService = inject(LinkService);
  protected unsubscribeAll = new Subject<void>();
  readonly id = `box-${boxIndex++}`;
  linkRef?: ComponentRef<LinkComponent>;

  agent = input(false, { transform: booleanAttribute });
  inputTitle = input('');
  origin = input<ConnectableEntryComponent>();
  state = input<'default' | 'selected' | 'processing' | 'processed'>('default');

  outputClick = output<ConnectableEntryComponent>();
  trashClick = output<void>();

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
    this.addLink();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  updateLink() {
    if (this.linkRef) {
      this.linkService.removeLink(this.linkRef);
    }
    this.addLink();
  }

  private addLink() {
    const entry = this.origin();
    if (entry && this.inputElement) {
      const leftBox = entry.outputElement.nativeElement.getBoundingClientRect();
      const rightBox = this.inputElement.nativeElement.getBoundingClientRect();
      this.linkRef = this.linkService.drawLink(leftBox, rightBox);
    }
  }
}
