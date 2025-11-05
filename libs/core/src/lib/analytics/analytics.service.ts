import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  logTrialSignup() {
    const dataLayer = (globalThis as unknown as any).dataLayer;
    dataLayer?.push({
      conversionAction: 'form-submit',
      contentType: 'trial signup',
      productName: 'Agentic RAG',
      event: 'conversion-event',
      transport: 'beacon',
    });
  }
  logTrialActivation() {
    const dataLayer = (globalThis as unknown as any).dataLayer;
    dataLayer?.push({
      conversionAction: 'form-submit',
      contentType: 'trial activation',
      productName: 'Agentic RAG',
      event: 'conversion-event',
      transport: 'beacon',
    });
  }
}
