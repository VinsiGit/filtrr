export interface Email {
  _id: string;
  id: string;
  sender_email: string;
  datetime_received: number;
  subject: string[];
  text_body: string[];
  label: string;
  keywords: string[];
  rating: number;
  datetime_start: number;
  datetime_end: number;
  datetime_elapsed: number;
  certainty: number;
  source: string;
}

export interface PasteInText {
  body: string;
}