import { Component } from '@angular/core';
import { ThemeService } from '../theme.service';
import * as ApexCharts from 'apexcharts';

@Component({
  selector: 'app-themeswitch',
  templateUrl: './themeswitch.component.html',
  styleUrls: ['./themeswitch.component.css']
})
export class ThemeswitchComponent {
  darkModeEnabled: boolean = false;

  constructor(public theme: ThemeService) {
    if (localStorage.getItem('darkMode') === null) {
      // If 'darkMode' item is not present, set default value to false
      this.darkModeEnabled = false;
    } else {
      // somewhat janky way to convert "true" or "false" back to bool, but it works and is short
      this.darkModeEnabled = localStorage.getItem('darkMode') === "true";
      console.log(this.darkModeEnabled);
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
        foreColor: this.theme.textcolor,
      },
      colors: [this.theme.irrelevant_color, this.theme.label1color, this.theme.label2color],
      grid: {
        borderColor: this.theme.gridcolor,
      },
      xaxis: {
        labels: {
          style: {
            colors: this.theme.axistextcolor,
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: this.theme.axistextcolor,
          },
        },
      },
    }, true, true, true);
    
    //paste-in response chart
    ApexCharts.exec('certaintyWheel', 'updateOptions', {
      colors: [this.theme.label1color]
    }, true, true, true);
  }

  applyTheme() {
    if (this.darkModeEnabled) {
      document.documentElement.style.setProperty('--shadow', '0 4px 12px 0 rgba(0, 0, 0, 0.2)');
      document.documentElement.style.setProperty('--nav-color', '#8363ee');
      document.documentElement.style.setProperty('--nav-color-hover', '#6B599C');
      document.documentElement.style.setProperty('--nav-color-text', '#edf2f9');
      document.documentElement.style.setProperty('--nav-color-background', '#312f51');
      document.documentElement.style.setProperty('--nav-background-gradient', 'linear-gradient(180deg, #7961f1 0%, #d672d2 100%');
      document.documentElement.style.setProperty('--page-color-background', '#292841');
      document.documentElement.style.setProperty('--page-background-gradient', 'radial-gradient(circle, rgba(75,80,134,1) 0%, rgba(49,53,110,1) 100%)');
      document.documentElement.style.setProperty('--page-color-text', '#edf2f9');
      document.documentElement.style.setProperty('--page-color-inactive', '#47426b');
      document.documentElement.style.setProperty('--module-color-border', '#312f51');
      document.documentElement.style.setProperty('--module-color-background', '#312f51');
      document.documentElement.style.setProperty('--module-color-text', '#7d7b8c');
      document.documentElement.style.setProperty('--module-color-highlight-complementary', '#f05365');
      document.documentElement.style.setProperty('--module-color-highlight-monochrome', '#7961f1');
      this.theme.gridcolor = "#47426b";
      this.theme.label1color = "#f05365";
      this.theme.label2color = "#f5a623";
      this.theme.textcolor = "#edf2f9";
      this.theme.axistextcolor = "#8e8ea7";
      this.theme.irrelevant_color = "#47426b";
    } else {
      document.documentElement.style.setProperty('--shadow', '0px 1px 22px -12px #607D8B');
      document.documentElement.style.setProperty('--nav-color', '#f05964');
      document.documentElement.style.setProperty('--nav-color-hover', '#eb5364');
      document.documentElement.style.setProperty('--nav-color-text', 'white');
      document.documentElement.style.setProperty('--nav-color-background', 'white');
      document.documentElement.style.setProperty('--nav-background-gradient', 'linear-gradient(180deg, rgba(240,83,101,1) 0%, rgba(246,142,95,1) 100%');
      document.documentElement.style.setProperty('--page-color-background', '#f0f4f8');
      document.documentElement.style.setProperty('--page-background-gradient', 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(241,241,241,1) 100%)');
      document.documentElement.style.setProperty('--page-color-text', '#46494c');
      document.documentElement.style.setProperty('--page-color-inactive', '#f0f4f8');
      document.documentElement.style.setProperty('--module-color-border', 'white');
      document.documentElement.style.setProperty('--module-color-background', 'white');
      document.documentElement.style.setProperty('--module-color-text', '#46494c');
      document.documentElement.style.setProperty('--module-color-highlight-complementary', '#7a6ce4');
      document.documentElement.style.setProperty('--module-color-highlight-monochrome', '#f05365');
      this.theme.gridcolor = "#f2f2f2";
      this.theme.label1color = "#6460af";
      this.theme.label2color = "#b872de";
      this.theme.textcolor = "#46494c";
      this.theme.axistextcolor = "#8e8ea7";
      this.theme.irrelevant_color = "#DBDEE4";
    }
    //update chart colors
    this.updateCharts()
  }
}