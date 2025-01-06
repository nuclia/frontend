import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  templateUrl: './sistema-scrollbar.component.html',
  styleUrls: ['sistema-scrollbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SistemaScrollbarComponent {
  code = `<div paScrollableContainer>dynamic scrollbar styling</div>
<div class="pa-scrollable">scrollbars hidden</div>
<div class="pa-scrollable pa-scrolling">scrollbars always visible with custom style</div>
`;
}
