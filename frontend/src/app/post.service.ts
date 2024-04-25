import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Email, PasteInText } from './interfaces/email';
import { environment } from '../environments/environment';
import { User } from './interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  hostname: string | undefined = environment.hostname;

  constructor(private http: HttpClient) { 
  }

  async postMail(mail: PasteInText): Promise<any> {
    const headers = new HttpHeaders().set('Source', 'site');
    const options = { headers: headers };
    return await lastValueFrom(this.http.post(`https://${this.hostname}/api`, mail, options));
  }

  addUser(user: User) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.post(`https://${this.hostname}/api/users`, user, { headers });
  }
}
