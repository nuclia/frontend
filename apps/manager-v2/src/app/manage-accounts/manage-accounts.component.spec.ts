import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageAccountsComponent } from './manage-accounts.component';

describe('AccountsComponent', () => {
  let component: ManageAccountsComponent;
  let fixture: ComponentFixture<ManageAccountsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ManageAccountsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageAccountsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
