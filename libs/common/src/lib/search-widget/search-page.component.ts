import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  viewChild,
  ViewEncapsulation,
  DOCUMENT,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ModalConfig, PaButtonModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { Widget } from '@nuclia/core';
import { SisModalService } from '@nuclia/sistema';
import { FeaturesService, NavigationService, UploadEventService } from '@flaps/core';
import { take } from 'rxjs';
import { SearchConfigurationComponent } from './search-configuration';
import { SearchWidgetService } from './search-widget.service';
import { EmbedWidgetDialogComponent } from './widgets';

@Component({
  selector: 'stf-search-page',
  imports: [CommonModule, TranslateModule, SearchConfigurationComponent, PaIconModule, PaButtonModule],
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.scss', '_common-form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SearchPageComponent implements OnDestroy {
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private searchWidgetService = inject(SearchWidgetService);
  private modalService = inject(SisModalService);
  private document = inject(DOCUMENT);
  private uploadEventService = inject(UploadEventService);
  private navigationService = inject(NavigationService);
  private features = inject(FeaturesService);

  configurationContainerElement = viewChild<ElementRef>('configurationContainer');
  previewStageElement = viewChild<ElementRef<HTMLElement>>('previewStage');
  searchConfigurationComponent = viewChild(SearchConfigurationComponent);

  widgetPreview = this.searchWidgetService.widgetPreview;
  inArag = this.navigationService.inArag();
  canModifyConfig = this.features.isKbAdmin;
  searchConfig?: Widget.AnySearchConfiguration;
  widgetOptions?: Widget.WidgetConfiguration;
  /** Set from the (redirected) old /widgets/:slug admin URL, if the current route carries one. */
  initialWidgetSlug = this.route.snapshot.paramMap.get('widgetSlug') ?? undefined;

  configPanelCollapsed = false;

  minPanelWidth = 320;
  panelTop = signal(0);
  panelWidth = signal(480);
  cssVariables = computed(() => `--panel-width:${this.panelWidth()}px; --panel-top:${this.panelTop()}px`);

  get previewMode(): Widget.WidgetConfiguration['widgetMode'] {
    return this.widgetOptions?.widgetMode ?? 'page';
  }

  get isPreviewDarkMode(): boolean {
    return this.widgetOptions?.darkMode === 'dark';
  }

  constructor() {
    this.searchWidgetService.searchTriggered.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.route.snapshot.paramMap.has('kb')) {
        this.uploadEventService.notifySearchPerformed();
      }
    });
  }

  ngOnDestroy() {
    this.searchWidgetService.resetSearchQuery();
  }

  /**
   * Called once the panel has ensured the current configuration is deployed as a widget (creating the
   * deployment on first use). Regenerates the snippet with the real widget id (so it includes the
   * widget_id-based synchronized snippet) and opens the embed dialog with the result.
   */
  openEmbedCode(widgetSlug: string) {
    if (!this.searchConfig) {
      return;
    }
    this.searchWidgetService.generateWidgetSnippet(this.searchConfig, this.widgetOptions, widgetSlug, '.preview-stage');
    this.searchWidgetService.widgetPreview.pipe(take(1)).subscribe(({ snippet, synchSnippet }) => {
      this.modalService.openModal(
        EmbedWidgetDialogComponent,
        new ModalConfig({ dismissable: true, data: { code: { snippet, synchSnippet } } }),
      );
      this.refreshPreview();
    });
  }

  updateConfig(config: Widget.AnySearchConfiguration) {
    this.searchConfig = config;
    this.refreshPreview();
  }

  updateWidgetOptions(widgetOptions: Widget.WidgetConfiguration) {
    this.widgetOptions = widgetOptions;
    this.refreshPreview();
  }

  toggleConfigurationPanel() {
    this.configPanelCollapsed = !this.configPanelCollapsed;
  }

  viewAllConfigurations() {
    this.searchConfigurationComponent()?.manageWidgets();
  }

  onPreviewContainerTransitionEnd(event: TransitionEvent) {
    if (event.propertyName === 'width') {
      this.refreshPreview();
    }
  }

  private refreshPreview() {
    if (!this.searchConfig) {
      return;
    }
    this.searchWidgetService.generateWidgetSnippet(
      this.searchConfig,
      this.getPreviewWidgetOptions(),
      undefined,
      '.preview-stage',
    );
  }

  private getPreviewWidgetOptions(): Widget.WidgetConfiguration | undefined {
    if (!this.widgetOptions || this.widgetOptions.widgetMode !== 'floating-chat') {
      return this.widgetOptions;
    }

    const previewStage = this.previewStageElement()?.nativeElement;
    if (!previewStage) {
      return this.widgetOptions;
    }

    const previewInset = 48;
    return {
      ...this.widgetOptions,
      panelWidth: Math.min(
        this.widgetOptions.panelWidth ?? 400,
        Math.max(previewStage.clientWidth - previewInset, 280),
      ),
      panelHeight: Math.min(
        this.widgetOptions.panelHeight ?? 600,
        Math.max(previewStage.clientHeight - previewInset, 320),
      ),
    };
  }

  startResizePanel(event: MouseEvent) {
    event.preventDefault();
    const mouseX = event.clientX;
    const lastWidth = this.panelWidth();

    const duringResize = (e: MouseEvent) => {
      const width = lastWidth + (mouseX - e.clientX);
      this.panelWidth.set(Math.max(width, this.minPanelWidth));
    };
    const finishResize = (e: MouseEvent) => {
      this.document.removeEventListener('mousemove', duringResize);
      this.document.removeEventListener('mouseup', finishResize);
      this.searchConfigurationComponent()?.updateHeight();
      this.document.defaultView?.requestAnimationFrame(() => this.refreshPreview());
    };
    this.document.addEventListener('mousemove', duringResize);
    this.document.addEventListener('mouseup', finishResize);
  }

  onScroll(event: Event) {
    this.panelTop.set((event.target as HTMLElement).scrollTop);
  }
}
