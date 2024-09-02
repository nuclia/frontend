import { ChangeDetectionStrategy, Component, inject, OnChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  AccordionBodyDirective,
  AccordionComponent,
  AccordionItemComponent,
  PaButtonModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { QuestionBlockComponent } from './question-block';
import { InfoCardComponent } from '@nuclia/sistema';
import { RouterLink } from '@angular/router';
import { RagLabService } from './rag-lab.service';
import { map, tap } from 'rxjs';
import { LabLayoutComponent } from './lab-layout/lab-layout.component';

@Component({
  selector: 'stf-rag-lab',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ReactiveFormsModule,
    PaTextFieldModule,
    QuestionBlockComponent,
    AccordionComponent,
    AccordionItemComponent,
    AccordionBodyDirective,
    PaTogglesModule,
    InfoCardComponent,
    RouterLink,
    PaButtonModule,
    LabLayoutComponent,
  ],
  templateUrl: './rag-lab.component.html',
  styleUrl: './_common-lab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RagLabComponent implements OnChanges {
  private ragLabService = inject(RagLabService);

  defaultGenerativeModel = this.ragLabService.kbConfigBackup.pipe(
    map((kbConfig) => kbConfig?.['generative_model'] || ''),
  );
  generativeModelMap = this.ragLabService.generativeModelMap;
  searchConfigurations = this.ragLabService.searchConfigurations.pipe(
    tap((configs) => {
      configs.forEach((config) =>
        this.form.addControl(config.id, new FormControl<boolean>(false, { nonNullable: true })),
      );
    }),
  );

  @ViewChild('labLayout', { read: LabLayoutComponent }) labLayoutComponent?: LabLayoutComponent;

  form = new FormGroup({});

  queries: string[] = [];

  get selectedConfigs(): string[] {
    return Object.entries(this.form.getRawValue())
      .filter(([, value]) => value)
      .map(([key]) => key);
  }

  ngOnChanges(): void {
    setTimeout(() => this.updateFormContent());
  }

  onQueriesChange(queries: string[]) {
    this.queries = queries;
    this.updateFormContent();
  }

  updateFormContent() {
    this.labLayoutComponent?.formContainer?.updateContentHeight();
  }

  generate() {
    //TODO
  }

  downloadCsv() {
    //TODO
    // this.ragLabService.downloadCsv(this.selectedModels);
  }
}
