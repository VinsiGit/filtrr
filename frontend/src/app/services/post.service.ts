import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { PasteInResponse, PasteInText } from '../interfaces/dataresponse';
import { environment } from '../../environments/environment';

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
}
