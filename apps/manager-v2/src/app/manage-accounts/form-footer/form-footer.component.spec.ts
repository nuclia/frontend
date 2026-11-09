import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormFooterComponent } from './form-footer.component';
import { MockProvider } from 'ng-mocks';
import { ManagerStore } from '../../manager.store';

describe('FormFooterComponent', () => {
  let component: FormFooterComponent;
  let fixture: ComponentFixture<FormFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFooterComponent],
      providers: [
        MockProvider(ManagerStore, {
          canEdit: signal(true),
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
