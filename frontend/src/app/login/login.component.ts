// src/app/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { PagetitleService } from '../services/pagetitle.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit{
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  hostname: string | undefined = environment.hostname;

  constructor(private auth: AuthService, private http: HttpClient, private title: PagetitleService) {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      // Call API to check if token is valid
      this.http.get(`https://${this.hostname}/api/tokencheck`).subscribe({
        next: (response: any) => {
          // Token is valid, perform login success action
          this.auth.loginsuccess(response.role, localStorage.getItem('username'));
        },
        error: (error) => {
          if (error.status === 401) {
            // Unauthorized, perform logout action
            this.auth.logout();
          } else {
            console.error('Error checking token:', error);
          }
        }
      });
   }
  }

  login(): void {
    this.auth.login(this.username, this.password).subscribe({
      next: (data) => {
        localStorage.setItem('access_token', data.access_token);
        this.auth.loginsuccess(data.role, this.username);
      },
      error: (error) => {
        this.errorMessage = 'Invalid username or password';
        console.error('Login error', error);
      }
    });
  }

  ngOnInit(){
    this.title.pageTitle = "login";
  }
}
