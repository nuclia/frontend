import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormFooterComponent } from './form-footer.component';
import { MockModule, MockProvider } from 'ng-mocks';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { ManagerStore } from '../../manager.store';
import { of } from 'rxjs';

describe('FormFooterComponent', () => {
  let component: FormFooterComponent;
  let fixture: ComponentFixture<FormFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockModule(PaButtonModule)],
      declarations: [FormFooterComponent],
      providers: [
        MockProvider(ManagerStore, {
          canEdit: of(true),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
