import { ChangeDetectionStrategy, Component, ElementRef, inject, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SearchConfigurationComponent } from './search-configuration';
import { SearchWidgetService } from './search-widget.service';

@Component({
  selector: 'stf-search-page',
  standalone: true,
  imports: [CommonModule, TranslateModule, SearchConfigurationComponent],
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.scss', '_common-form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SearchPageComponent {
  private searchWidgetService = inject(SearchWidgetService);

  @ViewChild('configurationContainer') configurationContainerElement?: ElementRef;
  widgetPreview = this.searchWidgetService.widgetPreview;
}
