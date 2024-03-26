import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DropdownButtonComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { PaDropdownModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LabelModule, LabelsService } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { Classification } from '@nuclia/core';
import { tap } from 'rxjs';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    CommonModule,
    PaDropdownModule,
    PaTextFieldModule,
    PaTogglesModule,
    TwoColumnsConfigurationItemComponent,
    ReactiveFormsModule,
    DropdownButtonComponent,
    LabelModule,
    TranslateModule,
  ],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormComponent {
  private labelService = inject(LabelsService);
  private cdr = inject(ChangeDetectorRef);

  @Input() webHookDescription = '';

  form = new FormGroup({
    filters: new FormGroup({
      searchIn: new FormControl<'titleOrContent' | 'title' | 'content'>('titleOrContent'),
      searchQuery: new FormControl<string>(''),
    }),
  });

  // TODO: load file type filters

  hasLabelSets = this.labelService.hasResourceLabelSets;
  resourceLabelSets = this.labelService.resourceLabelSets.pipe(
    tap((labelSets) => {
      if (labelSets) {
        // FIXME for edition
        const currentFilters = ''.split('\n');
        this.labelSelection = Object.entries(labelSets).reduce((selection, [id, labelset]) => {
          labelset.labels.forEach((label) => {
            const labelFilter = `/classification.labels/${id}/${label.title}`;
            if (currentFilters.includes(labelFilter)) {
              selection.push({ labelset: id, label: label.title });
            }
          });
          return selection;
        }, [] as Classification[]);
        this.cdr.markForCheck();
      }
    }),
  );
  labelSelection: Classification[] = [];

  updateFiltersWithLabels(labels: Classification[]) {
    // TODO
  }
}
