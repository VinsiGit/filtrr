import { Component, OnInit } from '@angular/core';
import { PagetitleService } from '../services/pagetitle.service';
import { environment } from '../../environments/environment';
import { User } from '../interfaces/user';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})


export class SettingsComponent {
  username: string = '';
  password: string = '';
  password_confirm: string = '';
  userType: string = 'user'; // default value
  errorMessage: string = '';

  constructor(private userService: UserService, private title: PagetitleService) { }

  ngOnInit() {
    this.title.pageTitle = "settings";
  }

  addUser() {
    if (this.password !== this.password_confirm) {
      this.errorMessage = "Passwords don't match";
      return;
    }

    const newUser: User = {
      username: this.username,
      password: this.password,
      role: this.userType
    };

    this.userService.addUser(newUser).subscribe(
      (response) => {
        // Handle success
        console.log('User added successfully', response);
        // Optionally, reset form fields
        this.username = '';
        this.password = '';
        this.password_confirm = '';
        this.userType = 'user'; // Reset to default value
        this.errorMessage = ''; // Clear error message
      },
      (error) => {
        // Handle error
        console.error('Error adding user', error);
        this.errorMessage = error.error.msg || 'Error adding user. Please try again later.';
      }
    );
  }
}

