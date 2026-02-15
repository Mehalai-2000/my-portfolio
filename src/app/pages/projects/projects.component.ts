import { Component } from '@angular/core';

@Component({
  selector: 'app-projects',
  imports: [],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css'
})
export class ProjectsComponent {
  projects = [
    {
      title: 'Jade Wealth Management',
      image: 'assets/mock.png',
      description: 'A comprehensive wealth management mobile application designed for real-time portfolio monitoring, asset allocation tracking, and secure financial management, providing users with actionable insights and seamless control over their investments.',
      status: 'Internal Application',
      tech: ['React Native', 'Expo', 'REST API']
    },
    {
      title: 'ZubeLife',
      image: 'assets/fintuit-image.png',
      description: 'A banking app to manage accounts, transactions, budgets, and savings. Includes tabs for account overview, expenses, and real-time updates. Contributed to UI design and testing.',
      tech: ['Angular', 'Bootstrap', 'REST API']
    },
    {
      title: 'AR CRM',
      image: 'assets/CRM.png',
      description: 'A CRM application designed for managing shares, stocks, mutual funds, and SIPs, enabling efficient portfolio tracking and client management.',
      link: '',
      tech: ['React Native', 'Expo', 'REST API']
    },
  ];
}
