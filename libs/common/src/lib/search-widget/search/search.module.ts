import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeprecatedSearchComponent } from './deprecated-search.component';
import { PaIconModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [CommonModule, PaTogglesModule, TranslateModule, PaIconModule],
  declarations: [DeprecatedSearchComponent],
  exports: [DeprecatedSearchComponent],
})
export class SearchModule {}
