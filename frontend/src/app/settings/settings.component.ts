import { Component, OnInit } from '@angular/core';
import { PagetitleService } from '../pagetitle.service';
import { environment } from '../../environments/environment';
import { PostService } from '../post.service';
import { User } from '../interfaces/user';

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

  constructor(private postService: PostService) { }

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

    this.postService.addUser(newUser).subscribe(
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

