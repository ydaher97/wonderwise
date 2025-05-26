
'use server';
/**
 * @fileOverview A service to fetch place suggestions using Google Places API.
 */
import type { Place } from '@/lib/mock-data'; 

export interface GooglePlacePhoto {
  photo_reference: string;
  height: number;
  width: number;
  html_attributions: string[];
}

export interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  vicinity?: string;
  types?: string[];
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: GooglePlacePhoto[];
  rating?: number;
  user_ratings_total?: number;
}

interface GooglePlacesTextSearchResponse {
  results: GooglePlaceResult[];
  status: string;
  error_message?: string;
  next_page_token?: string;
}

/**
 * Fetches suggested places based on location, type, and an optional query
 * using Google Places API (Text Search).
 */
export async function fetchPlaceSuggestions(
  location: string, 
  placeType: "restaurant" | "tourist_attraction" | "cafe",
  query?: string 
): Promise<Place[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error("Google Places API key is missing. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env");
    return [];
  }

  const fullQuery = query ? `${query} ${placeType} in ${location}` : `${placeType} in ${location}`;
  console.log({fullQuery});

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(fullQuery)}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Google Places API request failed with status: ${response.status}. Body: ${errorBody}`);
      return [];
    }

    const data: GooglePlacesTextSearchResponse = await response.json();

    if (data.status !== "OK") {
      console.error(`Google Places API error: ${data.status} - ${data.error_message || 'No error message provided.'}`);
      if (data.status === "REQUEST_DENIED" && data.error_message?.includes("Places API")) {
        console.error("Ensure the 'Places API' is enabled for your API key in the Google Cloud Console.");
      }
      return [];
    }

    return data.results.map((p: GooglePlaceResult): Place => {
      let imageUrl: string | undefined = undefined;
      if (p.photos && p.photos.length > 0) {
        imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photos[0].photo_reference}&key=${apiKey}`;
      }
      console.log(p.photos || "No photo reference");
      return {
        id: p.place_id,
        name: p.name,
        category: p.types && p.types.length > 0 ? p.types.map(t => t.replace(/_/g, ' ')).find(t => t === placeType) || p.types[0].replace(/_/g, ' ') : placeType,
        description: p.formatted_address || p.vicinity,
        lat: p.geometry?.location.lat,
        lng: p.geometry?.location.lng,
        imageUrl: imageUrl,
      };
    }).slice(0, 5); // Limit to 5 results

  } catch (error) {
    console.error("Error fetching or parsing Google Places API response:", error);
    return [];
  }
}
