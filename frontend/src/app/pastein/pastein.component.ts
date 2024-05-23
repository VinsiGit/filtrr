import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PostService } from '../services/post.service';
import { PagetitleService } from '../services/pagetitle.service';
import { PasteInResponse, Rating } from '../interfaces/dataresponse';
import { FormBuilder, FormGroup } from '@angular/forms';

import {
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexChart,
  ChartComponent
} from "ng-apexcharts";
import { ThemeService } from '../services/theme.service';
import { AnalyticsdataService } from '../services/analyticsdata.service';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  plotOptions: ApexPlotOptions;
};

@Component({
  selector: 'app-pastein',
  templateUrl: './pastein.component.html',
  styleUrls: ['./pastein.component.css']
})
export class PasteinComponent {
  @ViewChild("chart") chart: ChartComponent | undefined;
  public chartOptions: Partial<ChartOptions> | any;
  input: string = "";
  text: string = "";
  textBoxResponse: PasteInResponse | undefined;
  response: string = "";
  reviewForm: FormGroup;
  isPositiveSelected = false;
  isNegativeSelected = false;
  labels: string[] = [];
  actual_label_options: string[] = [];

  actual_label: string = "none";

  constructor(private route: ActivatedRoute, private post: PostService, private title: PagetitleService, private theme: ThemeService, private fb: FormBuilder, private data: AnalyticsdataService) {
    this.labels = this.data.labels;
    this.reviewForm = this.fb.group({
      feedback: ['']
    });
  }

  selectPositive() {
    this.isPositiveSelected = true;
    this.isNegativeSelected = false;
    this.reviewForm.get('feedback')?.reset();
    this.response = "";
  }

  selectNegative() {
    this.isPositiveSelected = false;
    this.isNegativeSelected = true;
    this.response = "";
  }

  ngOnInit() {
    this.title.pageTitle = "paste-in";
  }


  renderchart() {
    if(this.textBoxResponse)
    {
      this.chartOptions = {
        series: [Math.round((this.textBoxResponse.certainty*100) * 100) / 100], //round to 2 decimal places
        chart: {
          id: "certaintyWheel",
          height: 350,
          type: "radialBar"
        },
        colors: [this.theme.labelcolors[1]],  
        plotOptions: {
          radialBar: {
            hollow: {
              margin: 0,
              size: "65%",
              background: this.theme.radial_backgroundcolor
            },
            track: {
              background: this.theme.radial_trackcolor,
              dropShadow: {
                enabled: true,
                top: 1,
                left: 1,
                blur: 2,
                opacity: this.theme.shadowOpacity,
                color: this.theme.shadowcolor
              }
            },
            dataLabels: {
              name: {
                offsetY: -10,
                color: this.theme.radial_textcolor,
                fontSize: "13px"
              },
              value: {
                color: this.theme.radial_textcolor,
                fontSize: "30px",
                show: true
              }
            }
          }
        },
        fill: {
          type: "gradient",
          gradient: {
            shade: "dark",
            type: "vertical",
            gradientToColors: [this.theme.labelcolors[2]],
            stops: [0, 200]
          }
        },
        stroke: {
          lineCap: "round"
        },
        labels: [this.textBoxResponse.predicted_label.toLowerCase().replace('_', '-')]
      };
    }
  }

  async submitText() {
    try {
      const response = await this.post.postMail({"body": this.input});
      this.textBoxResponse = response;
      this.text = this.input;
      this.renderchart();
    } catch (error) {
      console.error('Error occurred:', error);
    }
  }

  async submitReview() {
    try {
      let rating: Rating = {
        body: this.input,
        rating: 0 // default to neutral rating
      };
  
      if (this.isPositiveSelected) {
        rating.rating = 1; // set rating to positive if positive is selected
      } else if (this.isNegativeSelected) {
        rating.rating = -1; // set rating to negative if negative is selected
      }
  
      if (this.actual_label) {
        if (this.actual_label != 'none'){
          rating.actual_label = this.actual_label.toUpperCase().replace('-', '_'); // include actual label if available
        }
        else {
          rating.actual_label = "";
        }
      }
  
      // Call the rate function from PostService to send PUT request
      this.response = (await this.post.rate(rating)).message; // Store response in 'response' variable
  
    } catch (error) {
      console.error('Error occurred:', error);
      console.log('PUT request failed:', error);
    }
  }
  
}
