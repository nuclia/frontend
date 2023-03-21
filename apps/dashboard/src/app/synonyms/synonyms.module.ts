import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SynonymsComponent } from './synonyms.component';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { ReactiveFormsModule } from '@angular/forms';

const routes = [
  {
    path: '',
    component: SynonymsComponent,
  },
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TranslateModule.forChild(),
    PaTextFieldModule,
    PaTogglesModule,
    PaButtonModule,
    ReactiveFormsModule,
  ],
  declarations: [SynonymsComponent],
})
export class SynonymsModule {}
