import { Component } from '@angular/core';
import { ThemeService } from '../services/theme.service';
import * as ApexCharts from 'apexcharts';
import { AnalyticsdataService } from '../services/analyticsdata.service';

@Component({
  selector: 'app-themeswitch',
  templateUrl: './themeswitch.component.html',
  styleUrls: ['./themeswitch.component.css']
})
export class ThemeswitchComponent {
  darkModeEnabled: boolean = false;

  constructor(public theme: ThemeService, public data: AnalyticsdataService) {
    if (localStorage.getItem('darkMode') === null) {
      // If 'darkMode' item is not present, set default value to false
      this.darkModeEnabled = false;
    } else {
      // somewhat janky way to convert "true" or "false" back to bool, but it works and is short
      this.darkModeEnabled = localStorage.getItem('darkMode') === "true";
    }
    this.applyTheme();
  }

  toggleDarkMode() {
    this.darkModeEnabled = !this.darkModeEnabled;
    //save user preference to localstorage
    localStorage.setItem('darkMode', this.darkModeEnabled.toString());
    this.applyTheme();
  }

  updateCharts() {
    //updating chart colors and rerendering the chart
    //email amount chart
    ApexCharts.exec('mailAmountGraph', 'updateOptions', {
      chart: {
        foreColor: this.theme.chart_textcolor,
      },
      colors: this.theme.labelcolors,
      grid: {
        borderColor: this.theme.chart_gridcolor,
      },
      xaxis: {
        labels: {
          style: {
            colors: this.theme.chart_axistextcolor,
          },
        },
      },
      yaxis: {
        stepSize: 1,
        labels: {
          style: {
            colors: this.theme.chart_axistextcolor,
          },
        },
      },
    }, true, true, true);


    //rating count chart
    ApexCharts.exec('ratingCountGraph', 'updateOptions', {
      chart: {
        foreColor: this.theme.chart_textcolor,
      },
      colors: this.theme.labelcolors,
      grid: {
        borderColor: this.theme.chart_gridcolor,
      },
      xaxis: {
        labels: {
          style: {
            colors: this.theme.chart_axistextcolor,
          },
        },
      },
      yaxis: {
        stepSize: 1,
        labels: {
          style: {
            colors: this.theme.chart_axistextcolor,
          },
        },
      },
    }, true, true, true);
    
    
    //evaluation chart
    ApexCharts.exec('evaluationGraph', 'updateOptions', {
      chart: {
        foreColor: this.theme.chart_textcolor,
      },
      colors: this.theme.labelcolors,
      grid: {
        borderColor: this.theme.chart_gridcolor,
      },
      xaxis: {
        labels: {
          style: {
            colors: this.theme.chart_axistextcolor,
          },
        },
      },
      yaxis: {
        stepSize: 1,
        labels: {
          style: {
            colors: this.theme.chart_axistextcolor,
          },
        },
      },
    }, true, true, true);
    
    //paste-in response chart
    ApexCharts.exec('certaintyWheel', 'updateOptions', {
      colors: [this.theme.labelcolors[1]],
      plotOptions: {
        radialBar: {
          hollow: {
            background: this.theme.radial_backgroundcolor
          },
          track: {
            background: this.theme.radial_trackcolor,
            dropShadow: {
              opacity: this.theme.shadowOpacity,
              color: this.theme.shadowcolor
            }
          },
          dataLabels: {
            name: {
              color: this.theme.radial_textcolor
            },
            value: {
              color: this.theme.radial_textcolor
            }
          }
        }
      },
      fill: {
        gradient: {
          shade: "light",
          gradientToColors: [this.theme.labelcolors[2]]
        }
      },
    }, true, true, true);

    //confusion matrix chart
    ApexCharts.exec('confusionmatrix', 'updateOptions', {
      chart: {
        foreColor: this.theme.chart_textcolor,
      },
      colors: this.theme.labelcolors,
      stroke: {
        colors: this.theme.matrix_bordercolor
      }
    }, true, true, true);

    for (let label of this.data.labels){
      ApexCharts.exec(`certaintyGraph-${label}`, 'updateOptions', {
        colors: [getComputedStyle(document.documentElement).getPropertyValue('--module-color-highlight-monochrome')],
      }, true, true, true);
    }

  }

  applyTheme() {
    if (!this.darkModeEnabled) {
      document.documentElement.style.setProperty('--shadow-float', '0px 1px 22px -12px #607D8B');
      document.documentElement.style.setProperty('--shadow-indent', '0px 1px 22px -12px #607D8B inset');
      document.documentElement.style.setProperty('--color-review-green', '#62e262');
      document.documentElement.style.setProperty('--color-review-red', '#f05964');
      document.documentElement.style.setProperty('--color-label_irrelevant', '#dbdee4');
      document.documentElement.style.setProperty('--color-label1', '#6460af');
      document.documentElement.style.setProperty('--color-label2', '#b872de');
      document.documentElement.style.setProperty('--nav-color', '#f05964');
      document.documentElement.style.setProperty('--nav-color-hover', '#eb5364');
      document.documentElement.style.setProperty('--nav-color-text', 'white');
      document.documentElement.style.setProperty('--nav-color-background', 'white');
      document.documentElement.style.setProperty('--nav-background-gradient', 'linear-gradient(180deg, rgba(240,83,101,1) 0%, rgba(246,142,95,1) 100%');
      document.documentElement.style.setProperty('--page-color-background', '#f0f4f8');
      document.documentElement.style.setProperty('--page-color-background-contrast', '#a5a8ab');
      document.documentElement.style.setProperty('--page-background-gradient', 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(241,241,241,1) 100%)');
      document.documentElement.style.setProperty('--page-color-text', '#46494c');
      document.documentElement.style.setProperty('--page-color-inactive', '#f0f4f8');
      document.documentElement.style.setProperty('--page-color-button', '#46494c');
      document.documentElement.style.setProperty('--page-color-button-pressed', '#9B9FA2');
      document.documentElement.style.setProperty('--page-color-button-pressed-warning', '#ff9190');
      document.documentElement.style.setProperty('--module-color-border', 'white');
      document.documentElement.style.setProperty('--module-color-background', 'white');
      document.documentElement.style.setProperty('--module-color-background-secondary', '#fcfdfe');
      document.documentElement.style.setProperty('--module-color-text', '#80848b');
      document.documentElement.style.setProperty('--module-color-text-secondary', '#bec1c4');
      document.documentElement.style.setProperty('--module-color-title', '#46494c');
      document.documentElement.style.setProperty('--module-color-highlight-complementary', '#7a6ce4');
      document.documentElement.style.setProperty('--module-color-highlight-monochrome', '#f05365');
      
      this.theme.labelcolors = ["#dbdee4", "#6460af", "#b872de"];
      
      this.theme.shadowcolor = "#607D8B";
      this.theme.shadowOpacity = 0.1;
      
      this.theme.chart_gridcolor = "#f2f2f2";
      this.theme.chart_textcolor = "#46494c";
      this.theme.chart_axistextcolor = "#8e8ea7";
    
      this.theme.radial_textcolor = "#46494c";
      this.theme.radial_trackcolor = "#F5F4FF";
      this.theme.radial_backgroundcolor = "#ffffff";

      this.theme.matrix_bordercolor = '#fcfdfe';
    } else {
      document.documentElement.style.setProperty('--shadow-float', '0 4px 12px 0 rgba(0, 0, 0, 0.2)');
      document.documentElement.style.setProperty('--shadow-indent', '0 4px 12px 0 rgba(0, 0, 0, 0.2) inset');
      document.documentElement.style.setProperty('--review-green', '#62e262');
      document.documentElement.style.setProperty('--review-red', '#f05964');
      document.documentElement.style.setProperty('--color-label_irrelevant', '#47426b');
      document.documentElement.style.setProperty('--color-label1', '#f05365');
      document.documentElement.style.setProperty('--color-label2', '#f68e5f');
      document.documentElement.style.setProperty('--nav-color', '#8363ee');
      document.documentElement.style.setProperty('--nav-color-hover', '#6B599C');
      document.documentElement.style.setProperty('--nav-color-text', '#edf2f9');
      document.documentElement.style.setProperty('--nav-color-background', '#312f51');
      document.documentElement.style.setProperty('--nav-background-gradient', 'linear-gradient(180deg, #7961f1 0%, #d672d2 100%');
      document.documentElement.style.setProperty('--page-color-background', '#292841');
      document.documentElement.style.setProperty('--page-color-background-contrast', '#605991');
      document.documentElement.style.setProperty('--page-background-gradient', 'radial-gradient(circle, rgba(75,80,134,1) 0%, rgba(49,53,110,1) 100%)');
      document.documentElement.style.setProperty('--page-color-text', '#edf2f9');
      document.documentElement.style.setProperty('--page-color-inactive', '#3C395E');
      document.documentElement.style.setProperty('--page-color-button', '#292841');
      document.documentElement.style.setProperty('--page-color-button-pressed', '#7971b7');
      document.documentElement.style.setProperty('--page-color-button-pressed-warning', '#ff9190');
      document.documentElement.style.setProperty('--module-color-border', '#312f51');
      document.documentElement.style.setProperty('--module-color-background', '#312f51');
      document.documentElement.style.setProperty('--module-color-background-secondary', '#47426b');
      document.documentElement.style.setProperty('--module-color-text', '#7d7b8c');
      document.documentElement.style.setProperty('--module-color-text-secondary', '#44416B');
      document.documentElement.style.setProperty('--module-color-title', '#c1bed8');
      document.documentElement.style.setProperty('--module-color-highlight-complementary', '#f05365');
      document.documentElement.style.setProperty('--module-color-highlight-monochrome', '#7961f1');

      this.theme.labelcolors = ["#47426b", "#f05365", "#f68e5f"];

      this.theme.shadowcolor = "rgba(0, 0, 0, 0.2)";
      this.theme.shadowOpacity = 0.3;
      
      this.theme.chart_gridcolor = "#47426b";
      this.theme.chart_textcolor = "#edf2f9";
      this.theme.chart_axistextcolor = "#8e8ea7";
    
      this.theme.radial_textcolor = "#ffffff";
      this.theme.radial_trackcolor = "#c1bed8";
      this.theme.radial_backgroundcolor = "#47426b";
      
      this.theme.matrix_bordercolor = '#47426b';
    }
    //update chart colors
    this.updateCharts()
  }
}