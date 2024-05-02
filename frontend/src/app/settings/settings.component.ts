import { Component, OnInit } from '@angular/core';
import { PagetitleService } from '../services/pagetitle.service';
import { environment } from '../../environments/environment';
import { Account, User } from '../interfaces/user';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})


export class SettingsComponent {
  newUser_username: string = '';
  newUser_password: string = '';
  newUser_password_confirm: string = '';
  newUser_role: string = 'user'; // default value
  userAdd_errorMessage: string = '';

  accounts: Account[] = [];

  constructor(private userService: UserService, private title: PagetitleService) { }

  ngOnInit() {
    this.title.pageTitle = "settings";
    this.getUserList();
  }

  getUserList() {
    return this.userService.getAllUsers().then(accounts => {
      this.accounts = accounts;
    });
  }

  addUser() {
    if (this.newUser_password !== this.newUser_password_confirm) {
      this.userAdd_errorMessage = "Passwords don't match";
      return;
    }

    const newUser: User = {
      username: this.newUser_username,
      password: this.newUser_password,
      role: this.newUser_role
    };

    this.userService.addUser(newUser).subscribe(
      (response) => {
        // Handle success
        console.log('User added successfully', response);
        // Optionally, reset form fields
        this.newUser_username = '';
        this.newUser_password = '';
        this.newUser_password_confirm = '';
        this.newUser_role = 'user'; // Reset to default value
        this.userAdd_errorMessage = ''; // Clear error message
        this.getUserList();
      },
      (error) => {
        // Handle error
        console.error('Error adding user', error);
        this.userAdd_errorMessage = error.error.msg || 'Error adding user. Please try again later.';
      }
    );
  }
}

