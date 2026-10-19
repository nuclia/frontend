import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaScrollModule } from '@guillotinaweb/pastanaga-angular';
import { PaDemoModule } from '@guillotinaweb/pastanaga-angular/demo';

@Component({
  templateUrl: './sistema-scrollbar.component.html',
  styleUrls: ['sistema-scrollbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaDemoModule, PaScrollModule],
})
export class SistemaScrollbarComponent {
  code = `<div paScrollableContainer>dynamic scrollbar styling</div>
<div class="pa-scrollable">scrollbars hidden</div>
<div class="pa-scrollable pa-scrolling">scrollbars always visible with custom style</div>
`;
}
