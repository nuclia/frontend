import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { SyncService } from '../sync/sync.service';

@Component({
  selector: 'da-connectors',
  templateUrl: './connectors.component.html',
  styleUrls: ['./connectors.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectorsComponent {
  connectors = [
    {
      id: 'gdrive',
      title: 'Google Drive',
      logo: 'assets/logos/gdrive.png',
      description: 'File storage and synchronization service developed by Google',
    },
  ];

  constructor(private sync: SyncService, private router: Router) {}

  goToConnector(connectorId: string) {
    this.sync.providers[connectorId].authenticate().subscribe(() => this.router.navigate(['/source/gdrive']));
  }
}
