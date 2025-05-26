
'use server';

import { db } from '@/lib/firebase';
import type { SavedItinerary, NewItineraryData } from '@/types/itinerary';
import type { GenerateItineraryOutput, DailyItinerary, ItineraryActivity } from '@/ai/flows/generate-itinerary'; // Import structured types
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  Timestamp,
  orderBy,
} from 'firebase/firestore';

/**
 * Saves a new itinerary to Firestore for a specific user.
 * @param userId The ID of the user saving the itinerary.
 * @param itineraryData The itinerary data to save. `itineraryText` should be the JSON.stringify-ed structured itinerary.
 * @returns The ID of the newly created itinerary document.
 */
export async function saveItinerary(
  userId: string,
  itineraryData: NewItineraryData 
): Promise<string> {
  if (!userId) {
    throw new Error('User ID is required to save an itinerary.');
  }
  try {
    // Validate that itineraryText is a parsable JSON string representing structuredItinerary
    try {
      JSON.parse(itineraryData.itineraryText) as GenerateItineraryOutput['structuredItinerary'];
    } catch (e) {
      console.error("Invalid JSON in itineraryText during save:", itineraryData.itineraryText);
      throw new Error("Internal error: Itinerary data is not in the correct format for saving.");
    }

    const itinerariesCol = collection(db, 'itineraries');
    const docRef = await addDoc(itinerariesCol, {
      ...itineraryData, 
      userId,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error: any) {
    console.error('Error saving itinerary to Firestore:', error);
    const originalErrorMessage = error.message || 'An unknown Firestore error occurred.';
    throw new Error(`Could not save itinerary: ${originalErrorMessage}. Please check server logs for details and verify Firestore rules.`);
  }
}

/**
 * Fetches all itineraries for a specific user from Firestore, ordered by creation date.
 * Converts Timestamps to ISO strings and parses itineraryText into structuredItinerary.
 * @param userId The ID of the user whose itineraries to fetch.
 * @returns A promise that resolves to an array of (SavedItinerary & { structuredItinerary: ... }) objects.
 */
export async function getUserItineraries(userId: string): Promise<Array<SavedItinerary & { structuredItinerary: GenerateItineraryOutput['structuredItinerary'] }>> {
  if (!userId) {
    return [];
  }
  try {
    const itinerariesCol = collection(db, 'itineraries');
    const q = query(
      itinerariesCol,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      let structuredItinerary: GenerateItineraryOutput['structuredItinerary'] = [];
      try {
        structuredItinerary = JSON.parse(data.itineraryText) as GenerateItineraryOutput['structuredItinerary'];
      } catch (e) {
        console.error(`Failed to parse itineraryText for itinerary ID ${docSnap.id}:`, e);
      }
      return {
        id: docSnap.id,
        userId: data.userId,
        name: data.name, 
        destination: data.destination,
        startDate: data.startDate,
        endDate: data.endDate,
        numberOfPeople: data.numberOfPeople,
        budget: data.budget,
        preferences: data.preferences,
        itineraryText: data.itineraryText, 
        createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
        structuredItinerary, 
      } as SavedItinerary & { structuredItinerary: GenerateItineraryOutput['structuredItinerary'] };
    });
  } catch (error) {
    console.error('Error fetching user itineraries from Firestore:', error);
    return [];
  }
}

/**
 * Fetches a single itinerary by its ID from Firestore.
 * Ensures the itinerary belongs to the specified user.
 * Converts Timestamps to ISO strings and parses itineraryText.
 * @param userId The ID of the user requesting the itinerary.
 * @param itineraryId The ID of the itinerary document to fetch.
 * @returns A promise that resolves to the (SavedItinerary & { structuredItinerary: ... }) object or null.
 */
export async function getItineraryById(
  userId: string,
  itineraryId: string
): Promise<(SavedItinerary & { structuredItinerary: GenerateItineraryOutput['structuredItinerary'] }) | null> {
  if (!userId || !itineraryId) {
    return null;
  }
  try {
    const itineraryDocRef = doc(db, 'itineraries', itineraryId);
    const docSnap = await getDoc(itineraryDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.userId !== userId) {
        console.warn('User attempted to fetch itinerary not belonging to them.');
        return null;
      }
      
      let structuredItinerary: GenerateItineraryOutput['structuredItinerary'] = [];
      try {
        structuredItinerary = JSON.parse(data.itineraryText) as GenerateItineraryOutput['structuredItinerary'];
      } catch (e) {
        console.error(`Failed to parse itineraryText for itinerary ID ${itineraryId}:`, e);
      }

      return {
        id: docSnap.id,
        userId: data.userId,
        name: data.name,
        destination: data.destination,
        startDate: data.startDate,
        endDate: data.endDate,
        numberOfPeople: data.numberOfPeople,
        budget: data.budget,
        preferences: data.preferences,
        itineraryText: data.itineraryText,
        createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
        structuredItinerary,
      } as SavedItinerary & { structuredItinerary: GenerateItineraryOutput['structuredItinerary'] };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching itinerary by ID from Firestore:', error);
    return null;
  }
}

    