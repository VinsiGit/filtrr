import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, Account } from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  hostname: string | undefined = environment.hostname;

  constructor(private http: HttpClient) { 
  }

  addUser(user: User) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.post(`https://${this.hostname}/api/users`, user, { headers });
  }
  
  async getAllUsers(): Promise<Account[]> {
    return lastValueFrom(this.http.get<Account[]>(`https://${this.hostname}/api/users`));
  }

  deleteUser(username: string) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const options = { headers: headers, body: { "username": username } };
    return this.http.delete(`https://${this.hostname}/api/users`, options);
  }
}


/*https://s144272.devops-ap.be/api/users*/