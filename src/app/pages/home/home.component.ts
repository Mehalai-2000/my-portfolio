import { Component, OnInit } from '@angular/core';
import { ScrollAnimationDirective } from '../../directives/scroll-animation.directive';

@Component({
  selector: 'app-home',
  imports: [ScrollAnimationDirective],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  displayText = '';
  private phrases = ['Ramumanimehalai', 'Frontend Developer'];
  private currentPhraseIndex = 0;
  private isDeleting = false;
  private typingSpeed = 100;
  private deletingSpeed = 50;
  private pauseTime = 2000;

  ngOnInit() {
    this.type();
  }

  private type() {
    const currentPhrase = this.phrases[this.currentPhraseIndex];

    if (this.isDeleting) {
      this.displayText = currentPhrase.substring(0, this.displayText.length - 1);
    } else {
      this.displayText = currentPhrase.substring(0, this.displayText.length + 1);
    }

    let typeSpeed = this.typingSpeed;

    if (this.isDeleting) {
      typeSpeed = this.deletingSpeed;
    }

    // If word is complete
    if (!this.isDeleting && this.displayText === currentPhrase) {
      typeSpeed = this.pauseTime; // Pause at end
      this.isDeleting = true;
    } else if (this.isDeleting && this.displayText === '') {
      this.isDeleting = false;
      this.currentPhraseIndex = (this.currentPhraseIndex + 1) % this.phrases.length;
      typeSpeed = 500; // Pause before typing next
    }

    setTimeout(() => this.type(), typeSpeed);
  }
}
