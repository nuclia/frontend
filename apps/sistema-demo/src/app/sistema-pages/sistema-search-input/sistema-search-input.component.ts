import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ControlModel } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'nsd-sistema-search-input',
  templateUrl: './sistema-search-input.component.html',
  styleUrls: ['./sistema-search-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SistemaSearchInputComponent {
  disabled = false;
  readonly = false;
  mode = '';
  modes = [
    new ControlModel({ id: 'title', value: 'title', label: 'In title' }),
    new ControlModel({ id: 'uid', value: 'uid', label: 'By UID' }),
    new ControlModel({ id: 'slug', value: 'slug', label: 'By Slug' }),
  ];
  ngModelCode = `// Typescript
search = '';

// Template:
<nsi-search-input [(ngModel)]="searchControl"
                    [readonly]="readonly"
                    [disabled]="disabled"
                    [modes]="modes"
                    (modeSelected)="onChange($event)">Search</nsi-search-input>`;

  formControlCode = `// Typescript
searchControl = new FormControl('');
modes = [
  new ControlModel({ id: 'title', value: 'title', label: 'In title' }),
  new ControlModel({ id: 'uid', value: 'uid', label: 'By UID' }),
  new ControlModel({ id: 'slug', value: 'slug', label: 'By Slug' }),
];

// Template:
<form>
  <nsi-search-input [formControl]="searchControl"
                      [readonly]="readonly"
                      [disabled]="disabled"
                      [modes]="modes"
                      (modeSelected)="onChange($event)">search</nsi-search-input>
</form>`;

  formGroupCode = `// Typescript
  modes = [
    new ControlModel({ id: 'title', value: 'title', label: 'In title' }),
    new ControlModel({ id: 'uid', value: 'uid', label: 'By UID' }),
    new ControlModel({ id: 'slug', value: 'slug', label: 'By Slug' }),
  ];
formGroup = new FormGroup({
  search: new FormControl('')
});

// Template:
<form [formGroup]="formGroup">
  <nsi-search-input formControlName="search"
                      [readonly]="readonly"
                      [disabled]="disabled"
                      [modes]="modes"
                       (modeSelected)="onChange($event)">Search</nsi-search-input>
</form>
`;
  onModeChange(mode: string) {
    this.mode = mode;
  }
}
