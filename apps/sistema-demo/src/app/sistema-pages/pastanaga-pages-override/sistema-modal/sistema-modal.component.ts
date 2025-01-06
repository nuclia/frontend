import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalConfig, ModalService } from '@guillotinaweb/pastanaga-angular';
import { DialogExampleComponent } from './dialog-example/dialog-example.component';
import { ModalExampleComponent } from './modal-example/modal-example.component';

@Component({
  templateUrl: './sistema-modal.component.html',
  styleUrls: ['./sistema-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SistemaModalComponent {
  dialogTemplate = `<pa-modal-dialog>
    <pa-modal-title>Dialog title</pa-modal-title>
    <pa-modal-description>Dialog description</pa-modal-description>
    <pa-modal-content>Some content like a small form</pa-modal-content>
    <pa-modal-footer>
        <pa-button kind="primary" (click)="modal.close('from primary')">Primary CTA</pa-button>
        <pa-button kind="secondary" aspect="basic" (click)="modal.close('from secondary')">Secondary CTA</pa-button>
    </pa-modal-footer>
</pa-modal-dialog>`;
  dialogComponent = `@Component({
    templateUrl: './dialog-example.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogExampleComponent {
    constructor(public modal: ModalRef) {}
}`;
  callerComponent = `import { ModalService } from 'pastanaga-angular';

export class CallerComponent {
    constructor(
        private modalService: ModalService,
    ) {}

    open() {
        this.modalService.openModal(DialogExampleComponent);
    }
}`;
  customModalComponent = `@Component({
    selector: 'my-own-modal',
    templateUrl: './own-modal.component.html',
    styleUrls: ['./own-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
})
export class OwnModalComponent extends BaseModalComponent implements AfterViewInit {

    ngAfterViewInit(): void {
        super.ngAfterViewInit();
    }
}`;
  customModalTemplate = `<div class="pa-modal-backdrop"
     tabindex="0"
     #modalContainer
     (click)="outsideClick($event)">
    <dialog class="pa-modal my-own-modal-style"
            role="dialog"
            [class.in]="!closing"
            [class.out]="closing">
        <header class="pa-modal-header">
            <h1>
                <ng-content select="pa-modal-title"></ng-content>
            </h1>
        </header>
        <ng-content select="pa-modal-content"></ng-content>
        <ng-content select="pa-modal-footer"></ng-content>
    </dialog>
</div>`;
  openModalConfig = `export class CallerComponent {
    open() {
        this.modalService.openModal(DialogExampleComponent, new ModalConfig({dismissable: false}));
    }
}`;
  modalCloseButtonSetup = `export class ModalComponent extends BaseModalComponent implements AfterViewInit {
    ngAfterViewInit() {
        if (!!this.ref) {
            this.ref.config.dismissable = false;
        }
        super.ngAfterViewInit();
    }
}
`;
  collectDataOnClose = `export class CallerComponent {
    open() {
        this.modalService.openModal(DialogExampleComponent).onClose.subscribe(data => console.log('Modal closed', data));
    }
}`;
  closingProgrammatically = `export class SomeDialogComponent {
    closeDialog() {
        this.modal.close({whatever: true, answer: 42});
    }
}`;
  passingDataToModal = `export class CallerComponent {
    open() {
        const modalRef = this.modalService.openModal(SomeDialogComponent, {
            data = { document: myDoc, user: myUser }
        });
    }
}`;
  accessingModalData = `export class SomeDialogComponent implements IModal {
    constructor(private dialog: ModalRef) {}

    ngOnInit() {
        this.document = this.dialog.data?.document;
        this.user = this.dialog.data?.user;
    }
}`;
  onEnterBinding = `export class SomeDialogComponent implements IModal {
    ngOnInit() {
        this.modal.onEnter = this.edit.bind(this);
    }

    edit() {
        this.modal.close({whatever: true, answer: 42});
    }
}`;

  constructor(private modalService: ModalService) {}

  openDialog() {
    this.modalService
      .openModal(
        DialogExampleComponent,
        new ModalConfig({
          data: { displayDescription: true },
        }),
      )
      .onClose.subscribe(console.log);
  }

  openModal(oneButton = false) {
    this.modalService
      .openModal(ModalExampleComponent, new ModalConfig({ data: { oneButton } }))
      .onClose.subscribe(console.log);
  }
}
