
import type { Timestamp } from 'firebase/firestore';
import type { DailyItinerary, GenerateItineraryOutput } from '@/ai/flows/generate-itinerary';

// This interface represents the structure of itinerary data stored in Firestore
export interface SavedItinerary {
  id: string; // Firestore document ID
  userId: string;
  name: string; // e.g., "Paris Trip July 2024" - can be auto-generated or user-defined. This is the itineraryTitle from AI output.
  destination: string;
  startDate: string; // ISO string format: "YYYY-MM-DD"
  endDate: string;   // ISO string format: "YYYY-MM-DD"
  numberOfPeople: number;
  budget: number;
  preferences: string;
  itineraryText: string; // The AI-generated itinerary content AS A JSON STRING of GenerateItineraryOutput.structuredItinerary
  createdAt: string; // ISO string
}

// Input structure for creating a new itinerary (subset of SavedItinerary)
// The `itineraryText` will be the JSON string of `structuredItinerary` from the AI.
// The `name` will be the `itineraryTitle` from the AI.
export type NewItineraryData = Omit<SavedItinerary, 'id' | 'userId' | 'createdAt'>;

// Type used by the store and components for the active itinerary
export type ActiveItinerary = Omit<SavedItinerary, 'itineraryText'> & {
  structuredItinerary: GenerateItineraryOutput['structuredItinerary'] | null;
};

    