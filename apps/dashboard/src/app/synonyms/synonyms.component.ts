import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SynonymsService } from './synonyms.service';
import { filter, map, Observable } from 'rxjs';
import { Synonyms } from '@nuclia/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SisModalService } from '@nuclia/sistema';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-synonyms',
  templateUrl: './synonyms.component.html',
  styleUrls: ['./synonyms.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SynonymsComponent {
  synonyms: Observable<Synonyms> = this.synonymsService.synonyms;
  hasSynonyms: Observable<boolean> = this.synonyms.pipe(map((synonyms) => Object.keys(synonyms).length > 0));

  addSynonymForm: FormGroup = new FormGroup({
    mainWord: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    synonyms: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  hoverOn = '';
  editing = '';

  constructor(
    private synonymsService: SynonymsService,
    private modalService: SisModalService,
    private translate: TranslateService,
  ) {
    this.synonymsService.loadSynonyms();
  }

  addSynonym() {
    const data = this.addSynonymForm.getRawValue();
    this.synonymsService.addSynonym(data.mainWord, data.synonyms);
    this.addSynonymForm.reset();
  }

  deleteEntry(mainWord: string, synonyms: string[]) {
    this.modalService
      .openConfirm({
        title: 'synonyms.confirm-deletion.title',
        description: this.translate.instant('synonyms.confirm-deletion.description', { word: mainWord, synonyms }),
        isDestructive: true,
      })
      .onClose.pipe(filter((confirmed) => !!confirmed))
      .subscribe(() => this.synonymsService.deleteSynonym(mainWord));
  }

  editSynonym(mainWord: string, $event: Event) {
    const input = $event.target as HTMLInputElement;
    this.synonymsService.editSynonym(mainWord, input.value);
    this.editing = '';
  }
}
