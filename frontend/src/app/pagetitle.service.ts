import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PagetitleService {
  pageTitle: string | undefined;
  
  constructor() { }
}
