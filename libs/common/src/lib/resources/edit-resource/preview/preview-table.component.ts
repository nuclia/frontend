import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { renderMarkdown } from '@flaps/core';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'stf-preview-table',
  templateUrl: 'preview-table.component.html',
  styleUrls: ['preview-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe],
})
export class PreviewTableComponent {
  @Input() set markdown(value: string) {
    this.renderedMarkdown = renderMarkdown(value);
  }

  renderedMarkdown: Observable<string> | undefined;
}
