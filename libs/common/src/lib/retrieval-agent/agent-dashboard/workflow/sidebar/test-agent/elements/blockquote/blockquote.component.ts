import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'stf-blockquote',
  imports: [CommonModule],
  templateUrl: './blockquote.component.html',
  styleUrl: './blockquote.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class BlockquoteComponent {}
