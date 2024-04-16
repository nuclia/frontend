import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  PaButtonModule,
  PaDropdownModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { map, Subject, take, takeUntil } from 'rxjs';
import { BadgeComponent, DropdownButtonComponent } from '@nuclia/sistema';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConnectorDefinition, LOCAL_SYNC_SERVER, SyncServerType, SyncService } from '../logic';
import { ConnectorComponent } from './connector';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    BadgeComponent,
    ConnectorComponent,
    DropdownButtonComponent,
    PaButtonModule,
    PaDropdownModule,
    PaTextFieldModule,
    PaTogglesModule,
    PaTooltipModule,
    ReactiveFormsModule,
    RouterOutlet,
    TranslateModule,
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent implements OnInit, OnDestroy {
  private syncService = inject(SyncService);
  private router = inject(Router);
  private currentRoute = inject(ActivatedRoute);

  private unsubscribeAll = new Subject<void>();

  // TODO: download dropdown is placed in the layout but will be implemented in https://app.shortcut.com/flaps/story/9739/setup-sync-agent-download-dropdown
  downloadSyncAgentFeature = false;

  inactiveServer = this.syncService.isServerDown;
  syncAgentForm = new FormGroup({
    type: new FormControl<SyncServerType>('desktop', { nonNullable: true }),
    serverUrl: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  connectors = this.syncService.connectorsObs.pipe(
    map((sources) => sources.sort((a, b) => a.title.localeCompare(b.title))),
  );
  serverUrlBackup = '';

  get syncAgentOnServer() {
    return this.syncAgentForm.controls.type.value === 'server';
  }
  get syncAgentTypeControl() {
    return this.syncAgentForm.controls.type;
  }
  get syncServerUrl() {
    return this.syncAgentForm.controls.serverUrl.value;
  }

  get serverUrlChanged() {
    return this.serverUrlBackup !== this.syncServerUrl;
  }

  ngOnInit() {
    this.syncService.syncServer.pipe(take(1)).subscribe((syncServer) => {
      this.syncAgentForm.patchValue(syncServer);
      this.serverUrlBackup = syncServer.serverUrl;
    });

    this.syncAgentTypeControl.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => this.saveSyncServer());
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  saveSyncServer() {
    if (this.syncAgentForm.valid) {
      const syncAgentConfig = this.syncAgentForm.getRawValue();
      const serverUrl = syncAgentConfig.type === 'server' ? syncAgentConfig.serverUrl : LOCAL_SYNC_SERVER;
      this.syncService.setSyncServer(serverUrl, syncAgentConfig.type);
    }
  }

  onSelectConnector(connector: ConnectorDefinition) {
    console.log(`Select connector`, connector);
  }
}
