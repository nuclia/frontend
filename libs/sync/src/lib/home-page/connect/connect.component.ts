import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  HeaderCell,
  PaButtonModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
  PaTableModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InfoCardComponent, SisModalService, SisToastService } from '@nuclia/sistema';
import { Subject, filter, map, shareReplay, startWith, switchMap, tap } from 'rxjs';
import { ConnectorComponent } from '../connector';
import { sourceDefinitions, SourcesService } from '../../logic/sources.service';

@Component({
  selector: 'nsy-connect',
  imports: [
    CommonModule,
    ConnectorComponent,
    InfoCardComponent,
    PaButtonModule,
    PaDropdownModule,
    PaIconModule,
    PaPopupModule,
    PaTableModule,
    PaTextFieldModule,
    PaTogglesModule,
    PaTooltipModule,
    ReactiveFormsModule,
    TranslateModule,
    RouterLink,
  ],
  templateUrl: './connect.component.html',
  styleUrls: ['./connect.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectComponent {
  private router = inject(Router);
  private currentRoute = inject(ActivatedRoute);
  private toaster = inject(SisToastService);
  private modalService = inject(SisModalService);
  private translate = inject(TranslateService);
  private sourcesService = inject(SourcesService);

  private refreshSources = new Subject<void>();
  
  sourceDefinitions = sourceDefinitions;
  selectedGroup: 'local' | 'mcp' | 'external' = 'local';

  sources = this.refreshSources.pipe(
    startWith(true),
    switchMap(() => this.sourcesService.getSources()),
    map((sources) =>
      Object.entries(sources).map(([id, source]) => {
        const def = Object.values(this.sourceDefinitions)
          .flat()
          .find((def) => def.type === source.type);
        return { id, logo: def?.logo, icon: def?.icon, title: def?.title, ...source };
      }),
    ),
    shareReplay(1),
  );

  tableHeader: HeaderCell[] = [
    new HeaderCell({ id: 'name', label: 'generic.name' }),
    new HeaderCell({ id: 'type', label: 'sync.home-page.connect.source-list.type' }),
    new HeaderCell({ id: 'description', label: 'generic.description' }),
    new HeaderCell({ id: 'actions', label: 'generic.actions' }),
  ];

  onSelectConnector(type: string) {
    this.router.navigate(['./add-source', type], { relativeTo: this.currentRoute });
  }

  deleteSource(id: string) {
    this.modalService
      .openConfirm({
        title: this.translate.instant('sync.home-page.connect.delete.title', { title: id }),
        description: 'sync.home-page.connect.delete.description',
        isDestructive: true,
        confirmLabel: 'generic.delete',
      })
      .onClose.pipe(
        filter((confirmed) => !!confirmed),
        switchMap(() => this.sourcesService.deleteSource(id)),
        tap(() => this.refreshSources.next()),
      )
      .subscribe({
        error: () => this.toaster.error('sync.home-page.connect.delete.failed'),
      });
  }
}
