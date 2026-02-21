import { Firestore } from '@google-cloud/firestore';

// Initialize Firestore. 
// Uses Application Default Credentials (ADC) as authenticated via gcloud CLI.
export const db = new Firestore();
