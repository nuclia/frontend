import { NgModule } from '@angular/core';

import { ConnectorsComponent } from './connectors.component';
import { ConnectorComponent } from './connector/connector.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [CommonModule, RouterModule],
  exports: [],
  declarations: [ConnectorsComponent, ConnectorComponent],
  providers: [],
})
export class ConnectorsModule {}
