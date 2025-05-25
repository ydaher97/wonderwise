
import type { SavedItinerary, ActiveItinerary } from '@/types/itinerary';
import type { GenerateItineraryOutput } from '@/ai/flows/generate-itinerary';
import { create } from 'zustand';

type ItineraryStoreState = {
  itineraryId: string | null;
  itineraryTitle: string | null; // from AI's itineraryTitle
  structuredItinerary: GenerateItineraryOutput['structuredItinerary'] | null;
  destination: string | null;
  budget: number | null;
  startDate?: string;
  endDate?: string;
  numberOfPeople?: number;
  preferences?: string;
  createdAt?: string; // ISO string

  isLoading: boolean;
  error: string | null;
  
  // Data for setting a newly generated itinerary
  setGeneratedItinerary: (data: {
    aiOutput: GenerateItineraryOutput;
    formInput: {
      destination: string;
      budget: number;
      startDate: string;
      endDate: string;
      numberOfPeople: number;
      preferences: string;
    };
    savedId?: string; // ID if it was just saved
    savedCreatedAt?: string; // Creation timestamp if just saved
  }) => void;
  
  // Data for loading a saved itinerary
  setLoadedItinerary: (data: SavedItinerary & { structuredItinerary: GenerateItineraryOutput['structuredItinerary'] }) => void;

  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearItinerary: () => void;
};

export const useItineraryStore = create<ItineraryStoreState>((set) => ({
  itineraryId: null,
  itineraryTitle: null,
  structuredItinerary: null,
  destination: null,
  budget: null,
  isLoading: false,
  error: null,

  setGeneratedItinerary: ({ aiOutput, formInput, savedId, savedCreatedAt }) => {
    set({
      itineraryId: savedId || null,
      itineraryTitle: aiOutput.itineraryTitle,
      structuredItinerary: aiOutput.structuredItinerary,
      destination: formInput.destination,
      budget: formInput.budget,
      startDate: formInput.startDate,
      endDate: formInput.endDate,
      numberOfPeople: formInput.numberOfPeople,
      preferences: formInput.preferences,
      createdAt: savedCreatedAt || (savedId ? new Date().toISOString() : undefined),
      isLoading: false,
      error: null,
    });
  },

  setLoadedItinerary: (data) => {
    set({
      itineraryId: data.id,
      itineraryTitle: data.name, // In saved data, 'name' field holds the itineraryTitle
      structuredItinerary: data.structuredItinerary,
      destination: data.destination,
      budget: data.budget,
      startDate: data.startDate,
      endDate: data.endDate,
      numberOfPeople: data.numberOfPeople,
      preferences: data.preferences,
      createdAt: data.createdAt,
      isLoading: false,
      error: null,
    });
  },

  setIsLoading: (loading) => set({ isLoading: loading, error: null }),
  setError: (error) => set({ error, isLoading: false }),
  clearItinerary: () => set({
    itineraryId: null,
    itineraryTitle: null,
    structuredItinerary: null,
    destination: null,
    budget: null,
    startDate: undefined,
    endDate: undefined,
    numberOfPeople: undefined,
    preferences: undefined,
    createdAt: undefined,
    isLoading: false,
    error: null,
  }),
}));

    