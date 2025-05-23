import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { renderMarkdown } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { TextField } from '@nuclia/core';
import { InfoCardComponent } from '@nuclia/sistema';
import { filter, map, Observable } from 'rxjs';
import { LineBreakFormatterPipe } from '../../../pipes';
import { EditResourceService } from '../../../resources';

@Component({
  selector: 'stf-session-info',
  imports: [CommonModule, InfoCardComponent, TranslateModule, LineBreakFormatterPipe],
  templateUrl: './session-info.component.html',
  styleUrl: './session-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionInfoComponent {
  private editResource = inject(EditResourceService);

  sessionInfo: Observable<TextField> = this.editResource.resource.pipe(
    map((session) => session?.data.texts?.['info']?.value),
    filter((info) => !!info),
  );

  getFormattedMarkdown(value: string): Observable<string> {
    return renderMarkdown(value);
  }
}
