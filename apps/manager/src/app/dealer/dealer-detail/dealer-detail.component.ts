import { DealerService } from './../../services/dealer.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';

@Component({
  selector: 'app-dealer-detail',
  templateUrl: './dealer-detail.component.html',
  styleUrls: ['./dealer-detail.component.scss'],
})
export class DealerDetailComponent implements OnInit {
  edit: boolean = false;
  editId: string | undefined;
  addUsers: boolean = false;
  userList: string[];
  appsList: string[] = ['tempus', 'stashify'];

  dealerForm = this.fb.group({
    id: [''],
    data: this.fb.group({
      app: [''],
      street: [''],
      city: [''],
      state: [''],
      zip: [''],
      cif: [''],
    }),
  });

  userForm = this.fb.group({
    user: this.fb.control(''),
    email: this.fb.control(''),
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dealerService: DealerService,
    private fb: UntypedFormBuilder,
  ) {
    this.userList = [];
    this.route.data.subscribe((data) => {
      if (data.dealer) {
        this.edit = true;
        this.addUsers = true;
        this.dealerForm.patchValue(data.dealer);
        this.editId = data.dealer.id;
        this.dealerForm.controls.id.disable();
        this.userList = data.dealer.users;
      }
    });
  }

  ngOnInit() {}

  addUser() {
    if (this.editId) {
      this.dealerService
        .addUser(this.userForm.value.user, this.userForm.value.email, this.editId)
        .subscribe((res) => this.userList.push(this.userForm.value.user));
    }
  }

  deleteUser(user: any) {
    if (this.editId) {
      this.dealerService.deleteUser(user, this.editId).subscribe((res) => {
        const index = this.userList.indexOf(user);
        delete this.userList[index];
      });
    }
  }

  save() {
    if (this.dealerForm.valid && this.edit && this.editId) {
      this.dealerService
        .edit(this.dealerForm.value, this.editId)
        .subscribe((res) => this.router.navigate(['/dealers']));
    } else if (this.dealerForm.valid && !this.edit) {
      this.dealerService.create(this.dealerForm.value).subscribe((res) => this.router.navigate(['/dealers']));
    }
  }
}
