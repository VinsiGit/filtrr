import { Component, OnInit } from '@angular/core';
import { PagetitleService } from '../services/pagetitle.service';
import { UserService } from '../services/user.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-retrain',
  templateUrl: './retrain.component.html',
  styleUrls: ['./retrain.component.css']
})
export class RetrainComponent implements OnInit{
  msg: string | undefined = undefined;
  buttonDisabled: boolean = false;
  loadingMessage: string = '';
  private loadingSubscription: Subscription | undefined;

  constructor(private title: PagetitleService, private user: UserService) {}

  ngOnInit() {
    this.title.pageTitle = "retrain model";
  }
  
  retrain(): void {
    this.user.retrain().subscribe({
      next: (response: any) => {
        console.log(response.msg);
        this.startLoading();
        this.disableButton();
      },
      error: (error) => {
        this.msg = 'error retraining, please try again';
        console.error('error trying to retrain', error);
        setTimeout(() => {
          this.msg = undefined;
        }, 2000);
      }
    });
  }

  disableButton(): void {
    this.buttonDisabled = true;
    setTimeout(() => {
      this.buttonDisabled = false;
      this.stopLoading();
      this.msg = 'retrain succesful';
    }, 120000); // 120 seconds
  }

  startLoading(): void {
    const loadingSteps = ['.', '..', '...'];
    let step = 0;
    this.loadingSubscription = interval(500).subscribe(() => {
      this.loadingMessage = `retraining ${loadingSteps[step]}`;
      step = (step + 1) % loadingSteps.length;
    });
  }

  stopLoading(): void {
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
      this.loadingMessage = '';
    }
  }
}
