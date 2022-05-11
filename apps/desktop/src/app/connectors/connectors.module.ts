import { NgModule } from '@angular/core';

import { ConnectorsComponent } from './connectors.component';
import { ConnectorComponent } from './connector/connector.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { STFButtonsModule, STFFormDirectivesModule, STFInputModule } from '@flaps/pastanaga';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    STFInputModule,
    STFFormDirectivesModule,
    ReactiveFormsModule,
    FormsModule,
    STFButtonsModule,
  ],
  exports: [ConnectorsComponent],
  declarations: [ConnectorsComponent, ConnectorComponent],
  providers: [],
})
export class ConnectorsModule {}
