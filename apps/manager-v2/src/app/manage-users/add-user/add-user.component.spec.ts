import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { UiToastService } from '@nuclia/ui/toast';
import { MockProvider } from 'ng-mocks';
import { UserService } from '../user.service';
import { AddUserComponent } from './add-user.component';

describe('AddUserComponent', () => {
  let component: AddUserComponent;
  let fixture: ComponentFixture<AddUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddUserComponent, RouterModule.forRoot([])],
      providers: [MockProvider(UserService), MockProvider(UiToastService)],
    }).compileComponents();

    fixture = TestBed.createComponent(AddUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should keep the form invalid until name and email are filled', () => {
    expect(component.form.invalid).toBe(true);
    component.form.patchValue({ name: 'Jane', email: 'jane@example.com' });
    expect(component.form.valid).toBe(true);
  });
});
