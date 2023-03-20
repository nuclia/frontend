import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SynonymsComponent } from './synonyms.component';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';

const routes = [
  {
    path: '',
    component: SynonymsComponent,
  },
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes), TranslateModule.forChild(), PaTextFieldModule],
  declarations: [SynonymsComponent],
})
export class SynonymsModule {}
