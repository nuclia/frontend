import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaDemoModule } from '../../../../../../../libs/pastanaga-angular/projects/demo/src/app/demo/demo.module';
import { PaScrollModule } from '../../../../../../../libs/pastanaga-angular/projects/pastanaga-angular/src/lib/scroll/scroll.module';

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
