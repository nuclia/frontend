import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { ReCaptchaV3Service } from 'ngx-captcha';
import { environment } from '../environments/environment';
import {
  IKnowledgeBox,
  Entities,
  Labels,
  Widgets,
  Resource,
  ResourceProperties,
  ExtractedDataTypes,
  WritableKnowledgeBox,
  FIELD_TYPE,
} from '@nuclia/core';
import { MyService } from './service';
import { forkJoin, Observable } from 'rxjs';

const SLUGIFY = new RegExp(/[^a-z0-9_-]/g);

@Component({
  selector: 'sdk-demo-with-credentials',
  templateUrl: './with-credentials.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WithCredentialsComponent {
  @ViewChild('fileInput') fileInput?: ElementRef;
  @ViewChild('dirInput') dirInput?: ElementRef;
  @ViewChild('kbDirInput') kbDirInput?: ElementRef;
  isAuthenticated = this.service.nuclia.auth.isAuthenticated();
  loginError = '';
  pending = false;
  accounts = this.isAuthenticated.pipe(
    filter((isAuthenticated) => isAuthenticated),
    switchMap(() => this.service.nuclia.db.getAccounts())
  );
  kbs: IKnowledgeBox[] = [];
  currentAccount = '';
  newKbSlug = '';
  currentKb?: WritableKnowledgeBox;
  widgets: Widgets | {} = {};
  entities: Entities | {} = {};
  labels: Labels | {} = {};
  newTitle = '';
  newLink = '';
  newBody = '';
  mode = 'resource';
  currentResource?: Resource;
  currentRessourceUUID = '8eb3a03963444f43b9401f43867cc965';
  progress = 0;

  constructor(
    private service: MyService,
    private reCaptchaV3Service: ReCaptchaV3Service,
    private cdr: ChangeDetectorRef
  ) {
    this.service.reinit(false);
    this.isAuthenticated.subscribe((isAuthenticated) => {
      console.log('isAuthenticated', isAuthenticated);
    });
  }

  login(data: { username: string; password: string }) {
    this.pending = true;
    this.reCaptchaV3Service.execute(environment.reCaptchaKey, 'login', (token) => {
      this.service.nuclia.auth.login(data.username, data.password, token).subscribe({
        next: (success) => {
          this.loginError = success ? '' : 'Error';
          console.log('logged in', success);
        },
        error: (error) => {
          this.loginError = 'Error';
          console.error(error);
        },
        complete: () => {
          this.pending = false;
          this.cdr?.markForCheck();
        },
      });
    });
  }

  logout() {
    this.service.nuclia.auth.logout();
    this.cdr?.markForCheck();
  }

  selectAccount(account: string, event: MouseEvent) {
    event.preventDefault();
    this.service.nuclia.db.getKnowledgeBoxes(account).subscribe((kbs) => {
      this.kbs = kbs;
      this.currentAccount = account;
      this.cdr?.markForCheck();
    });
  }

  createKB() {
    if (this.newKbSlug) {
      this.service.nuclia.db
        .createKnowledgeBox(this.currentAccount, { slug: this.newKbSlug, title: this.newKbSlug })
        .pipe(
          tap((kb) => {
            this.kbs.push(kb);
            this.newKbSlug = '';
          }),
          switchMap((kb) => this.setCurrentKb(kb))
        )
        .subscribe();
    }
  }

  deleteKB() {
    const currentKb = this.currentKb;
    if (currentKb) {
      currentKb.delete().subscribe(() => {
        this.kbs = this.kbs.filter((kb) => kb.id !== currentKb.id);
        this.currentKb = undefined;
        this.cdr?.markForCheck();
      });
    }
  }

  selectKB(kbSlug?: string) {
    if (kbSlug) {
      this.service.nuclia.db
        .getKnowledgeBox(this.currentAccount, kbSlug)
        .pipe(switchMap((kb) => this.setCurrentKb(kb)))
        .subscribe((kb) => {
          console.log('selected kb', kb);
        });
    }
  }

  private setCurrentKb(kb: IKnowledgeBox): Observable<void> {
    this.currentKb = kb as WritableKnowledgeBox;
    return forkJoin([kb.getEntities(), kb.getWidgets(), kb.getLabels()]).pipe(
      take(1),
      map(([entities, widgets, labels]) => {
        this.entities = entities;
        this.widgets = widgets;
        this.labels = labels;
        this.cdr?.markForCheck();
      })
    );
  }

  createResource() {
    const currentKb = this.currentKb;
    if (currentKb) {
      (this.newLink
        ? currentKb.createLinkResource({ uri: this.newLink })
        : currentKb.createResource({
            title: this.newTitle,
            texts: {
              text: {
                format: 'PLAIN',
                body: this.newBody,
              },
            },
            // keywordsets: { groups: { keywords: [{ value: 'group1' }, { value: 'group2' }] } },
          })
      ).subscribe((res) => {
        console.log('created resource', res);
        this.newTitle = '';
        this.newLink = '';
        this.newBody = '';
        this.currentRessourceUUID = res.uuid;
        this.cdr?.markForCheck();
      });
    }
  }

  addKeywords() {
    if (this.currentResource) {
      this.currentResource
        .addField(FIELD_TYPE.keywordset, 'groups', { keywords: [{ value: 'group1' }, { value: 'group2' }] })
        .subscribe();
    }
  }

  getResource() {
    this.currentKb
      ?.getResource(
        this.currentRessourceUUID,
        [ResourceProperties.BASIC, ResourceProperties.EXTRACTED, ResourceProperties.VALUES],
        [ExtractedDataTypes.TEXT, ExtractedDataTypes.FILE]
      )
      .subscribe((res) => {
        this.currentResource = res;
        this.cdr?.markForCheck();
      });
  }

  deleteResource() {
    if (this.currentResource) {
      this.currentResource.delete().subscribe(() => {
        this.currentResource = undefined;
        this.cdr?.markForCheck();
      });
    }
  }

  uploadFile() {
    const files: FileList = this.fileInput?.nativeElement.files;
    if (files.length > 0 && this.currentResource) {
      const id = files[0].name.toLowerCase().replace(SLUGIFY, '_');
      this.currentResource.upload(id, files[0]).subscribe();
    }
  }

  TUSuploadFile() {
    const files: FileList = this.fileInput?.nativeElement.files || [];
    if (files.length > 0 && this.currentResource) {
      const id = files[0].name.toLowerCase().replace(SLUGIFY, '_');
      this.currentResource.upload(id, files[0], true).subscribe((res) => {
        this.progress = res.progress || 0;
        this.cdr?.markForCheck();
      });
    }
  }

  TUSuploadDirectory() {
    const files: FileList = this.dirInput?.nativeElement.files || [];
    if (files.length > 0 && this.currentResource) {
      const f = files[0];
      this.currentResource.batchUpload(files).subscribe((res) => {
        this.progress = res.progress || 0;
        this.cdr?.markForCheck();
      });
    }
  }

  KBTUSuploadDirectory() {
    const files: FileList = this.kbDirInput?.nativeElement.files || [];
    if (files.length > 0 && this.currentKb) {
      const f = files[0];
      this.currentKb.batchUpload(files).subscribe((res) => {
        this.progress = res.progress || 0;
        this.cdr?.markForCheck();
      });
    }
  }

  createEntity() {
    const currentKb = this.currentKb;
    if (currentKb) {
      const last = Object.keys(this.entities).sort((x, y) => (x.localeCompare(y) ? -1 : 1))[0];
      const newGroup = (last || 'group1') + '1';
      currentKb
        .setEntitiesGroup(newGroup, { title: 'test group', entities: { abc: { value: 'ABC' } } })
        .pipe(switchMap(() => currentKb.getEntities()))
        .subscribe((entities) => {
          this.entities = entities;
          this.cdr?.markForCheck();
        });
    }
  }

  createLabels() {
    const currentKb = this.currentKb;
    if (currentKb) {
      const last = Object.keys(this.labels).sort((x, y) => (x.localeCompare(y) ? -1 : 1))[0];
      const newSet = (last || 'labels1') + '1';
      currentKb
        .setLabelSet(newSet, { title: 'some labels', color: 'blue', labels: [{ title: 'Batman' }] })
        .pipe(switchMap(() => currentKb.getLabels()))
        .subscribe((labels) => {
          this.labels = labels;
          this.cdr?.markForCheck();
        });
    }
  }

  createWidget() {
    const currentKb = this.currentKb;
    if (currentKb) {
      const last = Object.keys(this.widgets as Widgets).sort((x, y) => (x.localeCompare(y) ? -1 : 1))[0];
      const newWidget = (last || 'widget1') + '1';
      currentKb
        .saveWidget(newWidget, {
          id: newWidget,
          mode: 'button',
          features: {
            useFilters: false,
            suggestEntities: false,
            suggestSentences: false,
            suggestParagraphs: false,
          },
        })
        .pipe(switchMap(() => currentKb.getWidgets()))
        .subscribe((widgets) => {
          this.widgets = widgets;
          this.cdr?.markForCheck();
        });
    }
  }
}
