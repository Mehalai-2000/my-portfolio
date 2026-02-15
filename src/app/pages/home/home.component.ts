import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';


@Component({
  selector: 'app-home',
  imports: [LucideAngularModule, ScrollRevealDirective],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  typingTexts: string[] = [
    "Ramumanimehalai",
    "Frontend Developer",
    "Web App Developer",
    "Mobile App Developer",
    "UI Engineer"
  ];

  currentText = "";
  textIndex = 0;
  charIndex = 0;

  ngOnInit() {
    this.typeEffect();
  }

  typeEffect() {
    const currentWord = this.typingTexts[this.textIndex];

    if (this.charIndex < currentWord.length) {
      this.currentText += currentWord[this.charIndex];
      this.charIndex++;

      setTimeout(() => this.typeEffect(), 100); // typing speed
    } else {
      setTimeout(() => this.eraseEffect(), 1500); // wait before erasing
    }
  }

  eraseEffect() {
    if (this.charIndex > 0) {
      this.currentText = this.currentText.slice(0, -1);
      this.charIndex--;

      setTimeout(() => this.eraseEffect(), 60); // erase speed
    } else {
      this.textIndex = (this.textIndex + 1) % this.typingTexts.length;
      setTimeout(() => this.typeEffect(), 300);
    }
  }


}
