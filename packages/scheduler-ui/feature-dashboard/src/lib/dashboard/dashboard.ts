import { Component } from '@angular/core';
import { Header } from '../header/header';

@Component({
  selector: 'lib-dashboard',
  imports: [Header],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {}
