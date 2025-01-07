import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IConnector, ISyncEntity, LogEntity } from '../../logic';
import { SisLabelModule, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { PaDateTimeModule, PaIconModule, PaTableModule } from '@guillotinaweb/pastanaga-angular';
import { LabelsService, ParametersTableComponent } from '@flaps/core';
import { filter, map, take } from 'rxjs';
import { LabelSets } from '@nuclia/core';
import { ColoredLabel } from '@flaps/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'nsy-sync-settings',
  imports: [
    CommonModule,
    TwoColumnsConfigurationItemComponent,
    TranslateModule,
    SisLabelModule,
    PaDateTimeModule,
    PaTableModule,
    PaDateTimeModule,
    PaIconModule,
    ParametersTableComponent,
  ],
  templateUrl: './sync-settings.component.html',
  styleUrl: './sync-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncSettingsComponent implements AfterViewInit, OnInit {
  private labelService = inject(LabelsService);
  private cdr = inject(ChangeDetectorRef);
  private currentRoute = inject(ActivatedRoute);

  @Input({ required: true }) sync!: ISyncEntity;
  @Input({ required: true }) connector: IConnector | null = null;
  @Input() set logs(value: LogEntity[] | null | undefined) {
    if (value) {
      this._logs = value;
    }
  }
  get logs(): LogEntity[] {
    return this._logs;
  }
  private _logs: LogEntity[] = [];

  @ViewChild('activitySection') activitySection?: ElementRef;

  labelSets: LabelSets = {};
  coloredLabels: ColoredLabel[] = [];

  ngAfterViewInit() {
    this.currentRoute.queryParams
      .pipe(
        filter((params) => params['section']),
        map((params) => params['section']),
        take(1),
      )
      .subscribe({
        next: (section: string) => {
          setTimeout(() => {
            if (section === 'activity' && this.activitySection) {
              this.activitySection.nativeElement.scrollIntoView({
                behavior: 'smooth',
              });
            }
          }, 300);
        },
      });
  }

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
