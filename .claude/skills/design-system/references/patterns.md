# Design System Usage Patterns

Working code recipes — verified against sistema-demo templates and system source.

---

## Table of Contents

1. [Confirmation Dialog](#1-confirmation-dialog)
2. [Custom Modal](#2-custom-modal)
3. [Toast Notifications](#3-toast-notifications)
4. [Settings Page Layout](#4-settings-page-layout)
5. [Dropdown Button with Actions Menu](#5-dropdown-button-with-actions-menu)
6. [Reactive Form with Validation](#6-reactive-form-with-validation)
7. [Sortable Data Table with Actions](#7-sortable-data-table-with-actions)
8. [Tabs Navigation](#8-tabs-navigation)
9. [Page with Topbar and Sidenav](#9-page-with-topbar-and-sidenav)
10. [Infinite Scroll Table](#10-infinite-scroll-table)
11. [Expandable Configuration Section](#11-expandable-configuration-section)
12. [Label Classification UI](#12-label-classification-ui)
13. [Progress & Loading States](#13-progress--loading-states)
14. [Icon Usage Patterns](#14-icon-usage-patterns)
15. [Card Grid Layout](#15-card-grid-layout)

---

## 1. Confirmation Dialog

```ts
// component.ts
private modalService = inject(SisModalService);

deleteResource(id: string): void {
  this.modalService.openConfirm({
    title: 'Delete resource?',
    description: 'This action cannot be undone.',
    isDestructive: true,
    confirmLabel: 'Delete',
  }).onClose.subscribe((confirmed) => {
    if (confirmed) {
      this.resourceService.delete(id).subscribe(() => {
        this.toast.success('Resource deleted.');
        this.reload();
      });
    }
  });
}
```

> `SisModalService.openConfirm()` forces `cancelAspect: 'basic'` automatically.

---

## 2. Custom Modal

### Modal dialog component

```ts
// my-dialog.component.ts
import { ChangeDetectorRef, Component } from '@angular/core';
import { BaseModalComponent, ModalRef, PaButtonModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule, PaButtonModule, PaModalModule],
  template: `
    <pa-modal-dialog>
      <pa-modal-title>{{ modal.config.data.title }}</pa-modal-title>
      <pa-modal-description>{{ modal.config.data.description }}</pa-modal-description>
      <pa-modal-content>
        <ng-content></ng-content>
      </pa-modal-content>
      <pa-modal-footer>
        <pa-button kind="primary" (click)="modal.close(true)">Confirm</pa-button>
        <pa-button aspect="basic" (click)="modal.dismiss()">Cancel</pa-button>
      </pa-modal-footer>
    </pa-modal-dialog>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyDialogComponent extends BaseModalComponent {
  constructor(public override ref: ModalRef, protected override cdr: ChangeDetectorRef) {
    super(ref, cdr);
  }
  // Access data via this.modal.config.data (modal is BaseModalComponent.ref alias)
}
```

### Opening the modal

```ts
// parent component.ts
private modalService = inject(SisModalService);

openDialog(): void {
  const ref = this.modalService.openModal(MyDialogComponent, new ModalConfig({
    dismissable: true,
    data: { title: 'My Dialog', description: 'Choose an option' }
  }));

  ref.onClose.subscribe(result => {
    if (result) this.handleConfirmed();
  });
  ref.onDismiss.subscribe(() => {
    // user clicked backdrop or pressed Escape
  });
}
```

---

## 3. Toast Notifications

```ts
private toast = inject(SisToastService);

// After save:
this.resourceService.save(payload).subscribe({
  next: () => this.toast.success('Changes saved successfully.'),
  error: (err) => this.toast.error(`Failed to save: ${err.message}`),
});

// Background operation started:
this.toast.info('Processing started. You'll be notified when complete.');

// Approaching limit:
this.toast.warning('You have 5 resources remaining in your plan.');
```

---

## 4. Settings Page Layout

Full settings page with two-column rows, sticky save button:

```html
<!-- settings.component.html -->
<div class="page-spacing">
  <h1 class="page-title">{{ 'settings.title' | translate }}</h1>
  <p class="page-description">{{ 'settings.description' | translate }}</p>

  <form [formGroup]="form" (ngSubmit)="save()">
    <!-- Row 1: Toggle -->
    <nsi-two-columns-configuration-item
      itemTitle="Enable notifications"
      description="Receive alerts when a resource completes processing">
      <pa-toggle formControlName="notifications"></pa-toggle>
    </nsi-two-columns-configuration-item>

    <!-- Row 2: Select -->
    <nsi-two-columns-configuration-item
      itemTitle="Default language"
      description="Language for auto-generated content">
      <pa-select formControlName="language" [options]="languageOptions"></pa-select>
    </nsi-two-columns-configuration-item>

    <!-- Row 3: Locked feature -->
    <nsi-two-columns-configuration-item
      itemTitle="Advanced analytics"
      description="Requires Enterprise plan"
      [unauthorized]="!hasEnterprise"
      (clickOnUnauthorized)="showUpgrade()">
      <pa-toggle formControlName="analytics" [disabled]="!hasEnterprise"></pa-toggle>
    </nsi-two-columns-configuration-item>

    <nsi-sticky-footer>
      <pa-button kind="primary" type="submit" [disabled]="form.pristine || form.invalid">
        Save changes
      </pa-button>
      <pa-button aspect="basic" type="button" (click)="resetForm()">Discard</pa-button>
    </nsi-sticky-footer>
  </form>
</div>
```

```ts
// settings.component.ts
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    PaButtonModule, PaTextFieldModule, PaTogglesModule,
    TwoColumnsConfigurationItemComponent, StickyFooterComponent,
    TranslatePipe,
  ],
})
export class SettingsComponent {
  form = new FormGroup({
    notifications: new FormControl(false),
    language: new FormControl('en'),
    analytics: new FormControl({ value: false, disabled: true }),
  });

  save(): void {
    this.settingsService.save(this.form.getRawValue()).subscribe(() => {
      this.toast.success('Settings saved.');
    });
  }
}
```

---

## 5. Dropdown Button with Actions Menu

```html
<!-- component.html -->
<nsi-dropdown-button
  [popupRef]="actionsMenu"
  [open]="actionsMenu.open"
  icon="more-options">
  Actions
</nsi-dropdown-button>

<pa-dropdown #actionsMenu (onOpen)="onMenuOpen()" (onClose)="onMenuClose()">
  <pa-option value="edit" (click)="edit()">
    <pa-icon name="edit"></pa-icon>
    Edit
  </pa-option>
  <pa-option value="duplicate" (click)="duplicate()">
    <pa-icon name="copy"></pa-icon>
    Duplicate
  </pa-option>
  <pa-separator></pa-separator>
  <pa-option value="delete" class="destructive" (click)="delete()">
    <pa-icon name="delete"></pa-icon>
    Delete
  </pa-option>
</pa-dropdown>
```

For a simple icon button with dropdown (no label):
```html
<button [paPopup]="menu">
  <pa-icon name="more-options"></pa-icon>
</button>
<pa-dropdown #menu>
  <pa-option (click)="edit()">Edit</pa-option>
  <pa-option (click)="delete()">Delete</pa-option>
</pa-dropdown>
```

---

## 6. Reactive Form with Validation

```html
<!-- resource-form.component.html -->
<form [formGroup]="form" (ngSubmit)="submit()" class="form-container">
  <pa-input
    label="Name"
    formControlName="name"
    [errorMessages]="{ required: 'Name is required', maxLength: 'Max 100 characters' }">
  </pa-input>

  <nsi-expandable-textarea
    label="Description"
    modalTitle="Edit description"
    formControlName="description"
    placeholder="Describe your resource…"
    [rows]="3">
  </nsi-expandable-textarea>

  <pa-select
    label="Resource type"
    formControlName="type"
    [errorMessages]="{ required: 'Type is required' }">
    <pa-option value="document">Document</pa-option>
    <pa-option value="conversation">Conversation</pa-option>
    <pa-option value="link">Link</pa-option>
  </pa-select>

  <div class="inline-form">
    <pa-input label="Tags" formControlName="tagSearch" placeholder="Search tags…"></pa-input>
    <pa-button kind="secondary" type="button" (click)="addTag()">Add</pa-button>
  </div>

  <div>
    <pa-chip-closeable
      *ngFor="let tag of tags"
      [value]="tag"
      (closed)="removeTag($event.value)">
      {{ tag }}
    </pa-chip-closeable>
  </div>

  <div class="inline-form">
    <pa-button kind="primary" type="submit" [disabled]="form.invalid">Create</pa-button>
    <pa-button aspect="basic" type="button" (click)="cancel()">Cancel</pa-button>
  </div>
</form>
```

---

## 7. Sortable Data Table with Actions

```html
<!-- resources-table.component.html -->
<pa-table columns="3fr 1fr 1fr 1fr auto">
  <pa-table-sortable-header
    [cells]="headerCells"
    [menuColumn]="true"
    (sort)="onSort($event)">
  </pa-table-sortable-header>

  <pa-table-row *ngFor="let resource of resources">
    <pa-table-lead-cell-multi-line>
      <pa-table-lead-title>{{ resource.title }}</pa-table-lead-title>
      <pa-table-lead-description>{{ resource.slug }}</pa-table-lead-description>
    </pa-table-lead-cell-multi-line>

    <pa-table-cell>
      <nsi-status [status]="resource.status"></nsi-status>
      {{ resource.status }}
    </pa-table-cell>

    <pa-table-cell>{{ resource.created | date:'medium' }}</pa-table-cell>

    <pa-table-cell>
      <nsi-badge [count]="resource.labelCount" kind="neutral"></nsi-badge>
    </pa-table-cell>

    <pa-table-cell-menu>
      <pa-option (click)="edit(resource)">
        <pa-icon name="edit"></pa-icon> Edit
      </pa-option>
      <pa-option (click)="delete(resource)">
        <pa-icon name="delete"></pa-icon> Delete
      </pa-option>
    </pa-table-cell-menu>
  </pa-table-row>
</pa-table>
```

```ts
headerCells: HeaderCell[] = [
  { id: 'title',   label: 'Title',   sortable: true, active: true, direction: 'asc' },
  { id: 'status',  label: 'Status',  sortable: true, active: false },
  { id: 'created', label: 'Created', sortable: true, active: false },
  { id: 'labels',  label: 'Labels',  sortable: false },
];

onSort(event: { cell: HeaderCell, direction: 'asc' | 'desc' }): void {
  this.sortBy = event.cell.id;
  this.sortDir = event.direction;
  this.loadResources();
}
```

---

## 8. Tabs Navigation

```html
<!-- resource-detail.component.html -->
<pa-tabs>
  <pa-tab [active]="activeTab === 'overview'"   (click)="activeTab = 'overview'">Overview</pa-tab>
  <pa-tab [active]="activeTab === 'relations'"  (click)="activeTab = 'relations'">Relations</pa-tab>
  <pa-tab [active]="activeTab === 'metadata'"   (click)="activeTab = 'metadata'">Metadata</pa-tab>
  <pa-tab [active]="activeTab === 'processing'" (click)="activeTab = 'processing'">Processing</pa-tab>
</pa-tabs>

<div [ngSwitch]="activeTab">
  <app-overview   *ngSwitchCase="'overview'"></app-overview>
  <app-relations  *ngSwitchCase="'relations'"></app-relations>
  <app-metadata   *ngSwitchCase="'metadata'"></app-metadata>
  <app-processing *ngSwitchCase="'processing'"></app-processing>
</div>
```

With router integration:
```ts
// Preserve active tab in router state:
activeTab = this.route.snapshot.fragment ?? 'overview';

setTab(tab: string): void {
  this.activeTab = tab;
  this.router.navigate([], { fragment: tab, replaceUrl: true });
}
```

---

## 9. Page with Topbar and Sidenav

Already handled by `PaDemoModule` in sistema-demo. In production apps, the app shell is set up in `@flaps/core`. Components consume the shell via:

```html
<!-- Standard page content wrapper -->
<div class="page-spacing">
  <div class="page-title">{{ title }}</div>
  <!-- page content -->
</div>
```

The topbar height is available via `--app-topbar-height` CSS var and `$height-top-bar` SCSS var.

---

## 10. Infinite Scroll Table

```html
<!-- resources-list.component.html -->
<pa-table columns="2fr 1fr auto">
  <!-- ... header ... -->
  <pa-infinite-scroll (reachAnchor)="loadMore()">
    <pa-table-row *ngFor="let item of items">
      <!-- ... cells ... -->
    </pa-table-row>
  </pa-infinite-scroll>
</pa-table>

<nsi-spinner *ngIf="loading" size="small"></nsi-spinner>
```

```ts
loadingMore = false;
hasMore = true;

loadMore(): void {
  if (this.loadingMore || !this.hasMore) return;
  this.loadingMore = true;
  this.service.loadPage(++this.page).subscribe(items => {
    this.items.push(...items);
    this.hasMore = items.length === PAGE_SIZE;
    this.loadingMore = false;
    this.cdr.markForCheck();
  });
}
```

---

## 11. Expandable Configuration Section

```html
<!-- settings-section.component.html -->
<pa-expander>
  <ng-template pa-expander-header>
    Advanced settings
    <ng-template pa-expander-header-side-block>
      <nsi-badge kind="neutral">3 configured</nsi-badge>
    </ng-template>
  </ng-template>
  <ng-template pa-expander-body>
    <div class="form-container">
      <nsi-two-columns-configuration-item
        itemTitle="Custom endpoint"
        description="Override the default API endpoint">
        <pa-input formControlName="endpoint" placeholder="https://…"></pa-input>
      </nsi-two-columns-configuration-item>
    </div>
  </ng-template>
</pa-expander>
```

---

## 12. Label Classification UI

```html
<!-- classification.component.html -->
<nsi-labels-expander
  [labelSets]="labelSets$ | async"
  [currentSelection]="selection"
  (updateSelection)="onSelectionChange($event)">
</nsi-labels-expander>

<!-- Display selected labels: -->
<div class="selected-labels">
  <nsi-label
    *ngFor="let label of selectedLabels"
    [color]="label.color"
    (removeLabel)="removeLabel($event.value)">
    {{ label.title }}
  </nsi-label>
</div>
```

```ts
import { getSelectionKey, getLabelFromSelectionKey } from '@nuclia/sistema';

selection: { [key: string]: boolean } = {};

onSelectionChange(newSelection: { [key: string]: boolean }): void {
  this.selection = newSelection;
  // key format: "labelsetId/labelTitle"
  this.selectedLabels = Object.entries(newSelection)
    .filter(([, selected]) => selected)
    .map(([key]) => getLabelFromSelectionKey(key, this.labelSets));
}
```

---

## 13. Progress & Loading States

```html
<!-- Pattern 1: Full-page loading -->
<nsi-delayed-spinner *ngIf="loading$ | async" [delay]="500"></nsi-delayed-spinner>

<!-- Pattern 2: Inline spinner in button -->
<pa-button kind="primary" [disabled]="saving" (click)="save()">
  <nsi-spinner *ngIf="saving" size="small"></nsi-spinner>
  <span *ngIf="!saving">Save</span>
</pa-button>

<!-- Pattern 3: Upload progress -->
<nsi-progress-bar [progress]="uploadProgress$ | async"></nsi-progress-bar>

<!-- Pattern 4: Indeterminate (unknown duration) -->
<nsi-progress-bar [progress]="null"></nsi-progress-bar>
```

---

## 14. Icon Usage Patterns

```html
<!-- Standalone icon -->
<pa-icon name="settings"></pa-icon>

<!-- Icon in button (pa-button handles this internally): -->
<pa-button icon="add" [iconAndText]="true" kind="primary">Add resource</pa-button>

<!-- Icon with size -->
<pa-icon name="warning" size="large"></pa-icon>

<!-- MIME type icon via pipe -->
<pa-icon [name]="resource.mimeType | mimeIcon"></pa-icon>  <!-- SisIconsModule -->
<pa-icon [name]="resource.mimeType | standaloneMimeIcon"></pa-icon>  <!-- StandaloneMimeIconPipe -->

<!-- Notification badge with icon -->
<nsi-badge icon="warning" kind="neutral"></nsi-badge>

<!-- Status icon -->
<nsi-status status="processed"></nsi-status>  <!-- shows check icon -->
<nsi-status status="error"></nsi-status>       <!-- shows warning icon -->
<nsi-status status="pending"></nsi-status>     <!-- shows dash icon -->
```

---

## 15. Card Grid Layout

```html
<!-- home-page.component.html -->
<nsi-home-container>
  <h1 class="page-title">Get started</h1>

  <div class="cards-grid">
    <nsi-action-card
      tagLine="Step 1"
      title="Create a Knowledge Box"
      description="A Knowledge Box stores and indexes your content."
      textLink="Create Knowledge Box"
      navigateTo="/kb/create">
    </nsi-action-card>

    <nsi-action-card
      tagLine="Step 2"
      title="Add data sources"
      description="Connect SharePoint, Google Drive, or upload files directly."
      textLink="Add data source"
      navigateTo="/sync/add">
    </nsi-action-card>
  </div>

  <!-- Info panels -->
  <nsi-info-card type="warning" icon="warning">
    <strong>Account approaching limit.</strong>
    <p>You have used 90% of your storage quota.</p>
    <a class="accent-link" routerLink="/account/billing">Upgrade plan</a>
  </nsi-info-card>
</nsi-home-container>
```

```scss
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(rhythm(40), 1fr));
  gap: rhythm(2);
  margin-bottom: rhythm(3);
}
```

---

## Component Import Checklist

When building a feature, ensure the module/component imports are correct:

```ts
// Typical feature component imports array:
imports: [
  CommonModule,                  // NgIf, NgFor, AsyncPipe, etc.
  ReactiveFormsModule,           // FormGroup, FormControl
  RouterModule,                  // RouterLink, routerLink

  // Pastanaga
  PaButtonModule,
  PaTextFieldModule,             // pa-input, pa-textarea, pa-select
  PaTogglesModule,               // pa-checkbox, pa-toggle, pa-radio
  PaIconModule,                  // pa-icon
  PaTableModule,                 // pa-table etc.
  PaTabsModule,                  // pa-tabs, pa-tab
  PaDropdownModule,              // pa-dropdown, pa-option
  PaModalModule,                 // pa-modal-dialog etc.
  PaExpanderModule,              // pa-expander
  PaChipsModule,                 // pa-chip-closeable etc.
  PaScrollModule,                // pa-infinite-scroll
  PaTooltipModule,               // [paTooltip]
  TranslatePipe,                 // {{ 'key' | translate }}

  // Sistema standalone
  BadgeComponent,
  StatusComponent,
  ButtonMiniComponent,
  DropdownButtonComponent,
  TwoColumnsConfigurationItemComponent,
  StickyFooterComponent,
  ProgressBarComponent,
  ActionCardComponent,
  InfoCardComponent,
  SearchInputComponent,
  BackButtonComponent,
  FolderTreeComponent,
  LabelsExpanderComponent,
  StandaloneMimeIconPipe,

  // Sistema NgModules
  SisLabelModule,
  SisPasswordInputModule,
  SisProgressModule,            // nsi-spinner, nsi-delayed-spinner
]
```
