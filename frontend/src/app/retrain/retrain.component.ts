import { Component, OnInit } from '@angular/core';
import { PagetitleService } from '../pagetitle.service';

@Component({
  selector: 'app-retrain',
  templateUrl: './retrain.component.html',
  styleUrls: ['./retrain.component.css']
})
export class RetrainComponent implements OnInit{

  constructor(private title: PagetitleService) {
  }

  ngOnInit() {
    this.title.pageTitle = "retrain model";
  }
}
