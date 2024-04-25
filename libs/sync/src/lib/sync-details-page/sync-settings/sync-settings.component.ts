import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IConnector, ISyncEntity, LogEntity } from '../../logic';
import { SisLabelModule, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { PaDateTimeModule, PaIconModule, PaTableModule } from '@guillotinaweb/pastanaga-angular';
import { LabelsService } from '@flaps/core';
import { filter, map, take } from 'rxjs';
import { LabelSets } from '@nuclia/core';
import { ColoredLabel } from '@flaps/common';

@Component({
  selector: 'nsy-sync-settings',
  standalone: true,
  imports: [
    CommonModule,
    TwoColumnsConfigurationItemComponent,
    TranslateModule,
    SisLabelModule,
    PaDateTimeModule,
    PaTableModule,
    PaDateTimeModule,
    PaIconModule,
  ],
  templateUrl: './sync-settings.component.html',
  styleUrl: './sync-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncSettingsComponent implements OnInit {
  private labelService = inject(LabelsService);
  private cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) sync!: ISyncEntity;
  @Input({ required: true }) connector: IConnector | null = null;
  @Input() logs: LogEntity[] = [];

  labelSets: LabelSets = {};
  coloredLabels: ColoredLabel[] = [];

  ngOnInit() {
    this.labelService.resourceLabelSets
      .pipe(
        take(1),
        filter((labelSets) => !!labelSets),
        map((labelSets) => labelSets as LabelSets),
      )
      .subscribe((labelSets) => {
        this.labelSets = labelSets;
        this.coloredLabels =
          this.sync.labels?.map((label) => ({ ...label, color: this.labelSets[label.labelset]?.color })) || [];
        this.cdr.detectChanges();
      });
  }
}
