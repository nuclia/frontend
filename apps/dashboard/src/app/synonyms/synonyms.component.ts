import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SynonymsService } from './synonyms.service';
import { Observable } from 'rxjs';
import { Synonyms } from '@nuclia/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-synonyms',
  templateUrl: './synonyms.component.html',
  styleUrls: ['./synonyms.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SynonymsComponent {
  synonyms: Observable<Synonyms> = this.synonymsService.synonyms;

  addSynonymForm: FormGroup = new FormGroup({
    mainWord: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    synonyms: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor(private synonymsService: SynonymsService) {
    this.synonymsService.loadSynonyms();
  }

  addSynonym() {
    const data = this.addSynonymForm.getRawValue();
    this.synonymsService.addSynonym(data.mainWord, data.synonyms);
    this.addSynonymForm.reset();
  }
}
