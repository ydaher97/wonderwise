import { config } from 'dotenv';
config();

import '@/ai/flows/generate-itinerary.ts';
import '@/ai/flows/suggest-destinations.ts';
import '@/ai/flows/summarize-activity-reviews.ts';
