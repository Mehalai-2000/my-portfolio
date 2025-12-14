import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ScrollAnimationDirective } from '../../directives/scroll-animation.directive';

@Component({
  selector: 'app-about',
  imports: [LucideAngularModule, ScrollAnimationDirective],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent {


}
