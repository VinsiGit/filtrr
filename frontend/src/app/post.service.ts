import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Email, PasteInText } from './email';

@Injectable({
  providedIn: 'root'
})
export class PostService {

  constructor(private http: HttpClient) { 
  }

  async postMail(mail: PasteInText): Promise<any> {
    const headers = new HttpHeaders().set('Source', 'site');
    const options = { headers: headers };
    return await lastValueFrom(this.http.post("https://s144272.devops-ap.be/api", mail, options));
  }
}
