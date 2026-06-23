// src/types/email.ts

export interface ResendEmailPayload {
  to: string;
  subject: string;
  html: string;
}
