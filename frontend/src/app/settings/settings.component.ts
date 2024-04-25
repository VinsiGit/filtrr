import { Component, OnInit } from '@angular/core';
import { PagetitleService } from '../pagetitle.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit{
  username: string = '';
  password: string = '';
  password_confirm: string = '';
  errorMessage: string = '';
  hostname: string | undefined = environment.hostname;

  constructor(private title: PagetitleService) {
  }

  ngOnInit() {
    this.title.pageTitle = "settings";
  }
}

