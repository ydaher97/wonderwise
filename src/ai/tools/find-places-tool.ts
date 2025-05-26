
'use server';
/**
 * @fileOverview A Genkit tool for finding place suggestions (restaurants, attractions) with coordinates and image URLs using Google Places API.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { fetchPlaceSuggestions } from '@/services/places-service';
import type { Place } from '@/lib/mock-data';

const FindPlacesInputSchema = z.object({
  location: z.string().describe('The city and country, e.g., "Paris, France".'),
  placeType: z.enum(["restaurant", "tourist_attraction", "cafe"]).describe('The type of place to search for.'),
  query: z.string().optional().describe('A specific query for the place, e.g., "pizza", "museum of history", "coffee shop with Wi-Fi".'),
});

const FindPlacesOutputSchema = z.array(
  z.object({
    id: z.string().describe('A unique identifier for the place (e.g., Google Place ID).'),
    name: z.string().describe('The name of the place.'),
    category: z.string().describe('The category of the place, e.g., Restaurant, Museum.'),
    description: z.string().optional().describe('A brief description or address of the place.'),
    latitude: z.number().optional().describe('The latitude of the place.'),
    longitude: z.number().optional().describe('The longitude of the place.'),
    imageUrl: z.string().optional().describe('A URL to an image of the place, if available.'),
  })
).describe('A list of suggested places including their coordinates and image URLs if available from Google Places API.');


export const findPlacesTool = ai.defineTool(
  {
    name: 'findPlacesTool',
    description: 'Fetches real-time suggestions for places like restaurants, tourist attractions, or cafes in a given location using Google Places API. It returns details including coordinates and image URLs if available. Use this to find specific establishments to include in the itinerary. Always use the exact name returned by this tool when referring to the place in the itinerary.',
    inputSchema: FindPlacesInputSchema,
    outputSchema: FindPlacesOutputSchema,
  },
  async (input) => {
    try {
      // fetchPlaceSuggestions now calls the real Google Places API
      const places: Place[] = await fetchPlaceSuggestions(input.location, input.placeType, input.query);
      return places.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        description: p.description || '',
        latitude: p.lat,
        longitude: p.lng,
        imageUrl: p.imageUrl,
      }));
    } catch (error) {
      console.error('Error calling fetchPlaceSuggestions in findPlacesTool:', error);
      return []; 
    }
  }
);
