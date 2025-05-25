
/**
 * @fileOverview Place data interface for the WanderWise application.
 * Mock data has been removed as the application now fetches real data from Google Places API.
 */

export interface Place {
  id: string; // Unique ID for each place (e.g., Google Place ID)
  name: string;
  category: string; // e.g., "Restaurant", "Museum", "Park"
  description?: string; // Short description or address
  lat?: number;
  lng?: number;
  imageUrl?: string; // URL for an image of the place
}

// mockPlacesDatabase is no longer used by the primary flow.
// It can be removed or kept for testing/fallback purposes if desired later.
export const mockPlacesDatabase: Record<string, Record<string, Place[]>> = {
  // Example structure (data is no longer actively used for generation)
  "Paris, France": {
    restaurant: [
      { id: "paris_le_procope", name: "Le Procope", category: "Restaurant", description: "Historic French restaurant", lat: 48.853, lng: 2.3385, imageUrl: "https://placehold.co/300x200.png" },
    ],
    tourist_attraction: [
      { id: "paris_eiffel_tower", name: "Eiffel Tower", category: "Landmark", description: "Iconic iron lattice tower", lat: 48.8584, lng: 2.2945, imageUrl: "https://placehold.co/300x200.png" },
    ],
    cafe: [
      { id: "paris_cafe_de_flore", name: "Café de Flore", category: "Cafe", description: "Famous literary café", lat: 48.854, lng: 2.3325, imageUrl: "https://placehold.co/300x200.png" },
    ],
  },
};
