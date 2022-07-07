import { NgModule } from '@angular/core';

import { ConnectorsComponent } from './connectors.component';
import { ConnectorComponent } from './connector/connector.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PaButtonModule, PaDropdownModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    PaTextFieldModule,
    PaDropdownModule,
    PaButtonModule,
  ],
  exports: [ConnectorsComponent],
  declarations: [ConnectorsComponent, ConnectorComponent],
  providers: [],
})
export class ConnectorsModule {}
