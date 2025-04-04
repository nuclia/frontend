import {
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  inject,
  input,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoxDirective } from '../box.directive';

@Component({
  selector: 'app-agent-box',
  imports: [CommonModule],
  templateUrl: './agent-box.component.html',
  styleUrl: './agent-box.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentBoxComponent extends BoxDirective implements AfterViewInit {
  @ViewChild('inputElement') inputElement?: ElementRef;

  @HostBinding('class') get stateClass() {
    return this.state();
  }
  @HostBinding('class.is-agent') get isAgent() {
    return this.agent();
  }

  ngAfterViewInit(): void {
    const entry = this.inputEntry();
    if (entry && this.inputElement) {
      const leftBox = entry.outputElement.nativeElement.getBoundingClientRect();
      const rightBox = this.inputElement.nativeElement.getBoundingClientRect();
      this.linkService.drawLink(leftBox, rightBox);
    }
  }
}
