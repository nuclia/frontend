import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { renderMarkdown } from '@flaps/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'stf-preview-table',
  templateUrl: 'preview-table.component.html',
  styleUrls: ['preview-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class PreviewTableComponent {
  @Input() set markdown(value: string) {
    this.renderedMarkdown = renderMarkdown(value);
  }

  renderedMarkdown: Observable<string> | undefined;
}
