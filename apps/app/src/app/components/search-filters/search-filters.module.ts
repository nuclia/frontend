import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { STFCheckboxModule } from '@flaps/common';
import { STFExpanderModule } from '@flaps/pastanaga';

import { SearchFiltersComponent } from './search-filters/search-filters.component';
import { ButtonClearComponent } from './button-clear/button-clear.component';
import { FilterOntologyComponent } from './filter-ontology/filter-ontology.component';

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    FlexLayoutModule,
    TranslateModule.forChild(),
    STFCheckboxModule,
    STFExpanderModule
  ],
  declarations: [
    SearchFiltersComponent,
    ButtonClearComponent,
    FilterOntologyComponent
  ],
  exports: [],
})
export class SearchFiltersModule {}
