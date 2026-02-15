import { Component, AfterViewInit, ElementRef, Renderer2 } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-about',
  imports: [LucideAngularModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent implements AfterViewInit {

  constructor(
    private elRef: ElementRef<HTMLElement>,
    private renderer: Renderer2
  ) { }

  ngAfterViewInit() {
    // Trigger animation immediately on load/init to ensure content is visible.
    // This allows the animation to play once when the component renders.
    // Since the content is hidden by default (opacity: 0), we must trigger this.
    setTimeout(() => {
      this.triggerAnimation();
    }, 100);
  }

  private triggerAnimation() {
    const host = this.elRef.nativeElement;
    const revealEls: HTMLElement[] = Array.from(
      host.querySelectorAll('.reveal, .stagger-item')
    );

    revealEls.forEach((el, index) => {
      // Add visible class with staggered delay
      setTimeout(() => {
        this.renderer.addClass(el, 'visible');
      }, index * 100);
    });
  }
}
