import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmailService } from '../../services/email.service';


@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  contactForm: FormGroup;
  isLoading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private emailService: EmailService
  ) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required]
    });
  }

  async onSubmit() {
    this.successMessage = null;
    this.errorMessage = null;

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      this.errorMessage = 'Please fill all the fields';
      setTimeout(() => {
        this.errorMessage = null;
      }, 3000);
      return;
    }

    this.isLoading = true;

    const formValues = this.contactForm.value;

    try {
      const currentTime = new Date().toLocaleString();

      await this.emailService.sendEmail({
        name: formValues.name,
        time: currentTime,
        message: formValues.message,
        reply_to: formValues.email,
      });

      this.successMessage = 'Message sent successfully!';
      this.contactForm.reset();

      // Clear success message after 5 seconds
      setTimeout(() => {
        this.successMessage = null;
      }, 5000);

    } catch (error) {
      console.error('Email send failed', error);
      this.errorMessage = 'Failed to send message. Please try again later.';
    } finally {
      this.isLoading = false;
    }
  }
}
