import { Component } from '@angular/core';
import { Size } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'nsd-sistema-buttons',
  templateUrl: './sistema-buttons.component.html',
  styleUrls: [
    '../../../../../../../libs/pastanaga-angular/projects/demo/src/app/demo/pages/button-page/button-page.component.scss',
  ],
})
export class SistemaButtonsComponent {
  selectedSize: Size = 'medium';
  activeState = false;
  disabledState = false;
  codeExample = `<pa-button [kind]="selectedKind"
           [size]="selectedSize"
           [aspect]="selectedAspect"
           [disabled]="disabledState">
    Value
</pa-button>

<pa-button icon="search"
           iconAndText
           [kind]="selectedKind"
           [size]="selectedSize"
           [iconSize]="selectedSize === 'large' ? selectedSize : 'small'"
           [aspect]="selectedAspect"
           [disabled]="disabledState">
    Value
</pa-button>

<pa-button icon="search"
           [kind]="selectedKind"
           [size]="selectedSize"
           [iconSize]="selectedSize === 'large' ? selectedSize : 'small'"
           [aspect]="selectedAspect"
           [disabled]="disabledState">
    Value
</pa-button>`;

  clickOn($event: MouseEvent) {
    console.log(`Clicked on button`, $event);
  }
}
