import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FIELD_TYPE, Resource } from '@nuclia/core';
import { DatePickerComponent, ModalConfig } from '@guillotinaweb/pastanaga-angular';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { catchError, delay, filter, forkJoin, of, switchMap, take } from 'rxjs';
import { EditResourceService } from '../edit-resource';
import { MemoryTranscriptModalComponent } from './memory-transcript-modal/memory-transcript-modal.component';
import { MemoryEntry, MemoryFact } from './memory.model';
import { MemoryService } from './memory.service';

@Component({
  selector: 'stf-memory',
  templateUrl: './memory.component.html',
  styleUrl: './memory.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  providers: [MemoryService],
})
export class MemoryComponent implements OnInit {
  private modal = inject(SisModalService);
  private toaster = inject(SisToastService);
  private editResource = inject(EditResourceService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  protected service = inject(MemoryService);
  protected factDateControl = new FormControl<string | null>(null);
  protected searchControl = new FormControl<string | null>(null);
  private expandedFactIds = new Set<string>();

  // pa-date-picker's own inputControl must be reset directly; its valueChanges pipe filters out null.
  @ViewChild(DatePickerComponent) private datePicker?: DatePickerComponent;

  ngOnInit() {
    this.editResource.setCurrentView('memory');
    this.service.loadAllFacts().subscribe();
    this.factDateControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((dateIso) => this.service.setDateFilter(dateIso || null));
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((term) => this.service.setSearchTerm(term || ''));
  }

  protected toggleFact(fact: MemoryFact) {
    if (this.isFactExpanded(fact.id)) {
      this.expandedFactIds.delete(fact.id);
    } else {
      this.expandedFactIds.add(fact.id);
      // Related entries all come from the same source session; load (and cache) it once.
      this.service.loadSessionEntries(fact.sessionFieldId).subscribe();
    }
  }

  protected isFactExpanded(factId: string): boolean {
    return this.expandedFactIds.has(factId);
  }

  protected relatedEntriesOf(fact: MemoryFact): MemoryEntry[] {
    const sessionEntries = this.service.sessionEntries()[fact.sessionFieldId] || [];
    return sessionEntries.filter((entry) => fact.content.related_entry_ids.includes(entry.id));
  }

  protected clearDateFilter() {
    this.factDateControl.reset();
    this.datePicker?.inputControl.reset();
  }

  protected sessionDisplayName(sessionFieldId: string): string {
    return sessionFieldId.replace(/^__memory__/, '');
  }

  protected openTranscript(fact: MemoryFact) {
    this.service.loadSessionEntries(fact.sessionFieldId).subscribe((entries) =>
      this.modal.openModal(
        MemoryTranscriptModalComponent,
        new ModalConfig({
          data: {
            sessionLabel: this.sessionDisplayName(fact.sessionFieldId),
            entries,
          },
        }),
      ),
    );
  }

  /** Deletes every session's conversation + facts field, not the whole resource (other fields may still be in use). */
  protected deleteMemoryResource() {
    this.modal
      .openConfirm({
        title: 'resource.memory.delete.title',
        description: 'resource.memory.delete.description',
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.editResource.resource),
        take(1),
        filter((resource): resource is Resource => !!resource),
        switchMap((resource) => {
          const fieldIds = this.service.sessionInfos().flatMap((session) => [session.fieldId, session.factsFieldId]);
          if (fieldIds.length === 0) return of(resource);
          return forkJoin(
            fieldIds.map((fieldId) =>
              resource.deleteField(FIELD_TYPE.conversation, fieldId, true).pipe(
                // A facts field may not exist yet; catch with a value (not EMPTY) so forkJoin still completes.
                catchError(() => of(null)),
              ),
            ),
          ).pipe(
            // Backend settles field metadata asynchronously; reloading immediately can return stale fields (same pattern as ResourcesTableDirective).
            delay(1000),
            switchMap(() => this.editResource.loadResource(resource.id)),
          );
        }),
      )
      .subscribe(() => {
        this.toaster.success('resource.memory.delete.success');
        // Fields are gone, so navigate to the resource's main view instead of staying on "memory".
        this.router.navigate(['../resource'], { relativeTo: this.route });
      });
  }
}
