import { Injectable } from '@angular/core';
import emailjs, { EmailJSResponseStatus } from '@emailjs/browser';
import { EmailJSConfig } from '../config/emailjs.config';

@Injectable({
    providedIn: 'root'
})
export class EmailService {

    constructor() {
        emailjs.init(EmailJSConfig.PUBLIC_KEY);
    }

    async sendEmail(templateParams: Record<string, unknown>): Promise<EmailJSResponseStatus> {
        try {
            const response = await emailjs.send(
                EmailJSConfig.SERVICE_ID,
                EmailJSConfig.TEMPLATE_ID,
                templateParams
            );
            return response;
        } catch (error) {
            throw error;
        }
    }
}
