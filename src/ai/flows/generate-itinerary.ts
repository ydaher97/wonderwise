
'use server';
/**
 * @fileOverview Generates a personalized multi-day travel itinerary based on user inputs.
 * The itinerary is returned as a structured JSON object.
 *
 * - generateItinerary - A function that generates a travel itinerary.
 * - GenerateItineraryInput - The input type for the generateItinerary function.
 * - GenerateItineraryOutput - The return type for the generateItinerary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { findPlacesTool } from '@/ai/tools/find-places-tool';

const GenerateItineraryInputSchema = z.object({
  destination: z.string().describe('The destination for the trip.'),
  startDate: z.string().describe('The start date of the trip (YYYY-MM-DD).'),
  endDate: z.string().describe('The end date of the trip (YYYY-MM-DD).'),
  numberOfPeople: z.number().describe('The number of people on the trip.'),
  budget: z.number().describe('The budget for the trip in USD.'),
  preferences: z.string().describe('The preferences for the trip, such as types of attractions and restaurants.'),
});
export type GenerateItineraryInput = z.infer<typeof GenerateItineraryInputSchema>;

// New Structured Output Schemas
const ActivityPlaceDetailsSchema = z.object({
  id: z.string().describe("Google Place ID or unique identifier from the findPlacesTool."),
  name: z.string().describe("The exact name of the place as returned by the findPlacesTool."),
  category: z.string().optional().describe("Category of the place (e.g., Restaurant, Museum)."),
  latitude: z.number().optional().describe("Latitude of the place."),
  longitude: z.number().optional().describe("Longitude of the place."),
  imageUrl: z.string().optional().describe("URL for an image of the place."),
  description: z.string().optional().describe("Brief description or address of the place from the tool.")
}).describe("Details of a specific place found using the findPlacesTool.");

const ItineraryActivitySchema = z.object({
  id: z.string().describe("A unique ID for this activity entry (e.g., generated UUID for frontend key)."),
  time: z.string().optional().describe("Suggested time for the activity (e.g., '9:00 AM', 'Lunchtime', 'Morning', 'Afternoon', 'Evening')."),
  description: z.string().describe("Textual description of the activity, e.g., 'Visit the Eiffel Tower' or 'Lunch'. This should be engaging."),
  placeDetails: ActivityPlaceDetailsSchema.optional().describe("If this activity involves a specific place found by the tool, its details are here."),
  notes: z.string().optional().describe("Any additional notes, tips, or booking information for this activity.")
}).describe("A single activity or event in the itinerary.");

const DailyItinerarySchema = z.object({
  day: z.number().describe("The day number (e.g., 1, 2, 3)."),
  date: z.string().optional().describe("The specific date for this day (e.g., '2024-08-15'). Format as YYYY-MM-DD."),
  title: z.string().optional().describe("A general title for the day (e.g., 'Arrival and City Exploration', 'Museum Hopping')."),
  summary: z.string().optional().describe("A brief summary of the day's plan, 1-2 sentences."),
  activities: z.array(ItineraryActivitySchema).describe("A list of activities scheduled for this day.")
}).describe("The itinerary for a single day.");

const GenerateItineraryOutputSchema = z.object({
  itineraryTitle: z.string().describe("A creative and engaging title for the entire trip, e.g., 'Parisian Adventure for 2' or 'Exploring Ancient Rome'. This should NOT include the raw itinerary, just a title."),
  structuredItinerary: z.array(DailyItinerarySchema).describe("An array of daily itineraries, forming the complete travel plan. This is the main output for the itinerary content.")
});
export type GenerateItineraryOutput = z.infer<typeof GenerateItineraryOutputSchema>;
export type DailyItinerary = z.infer<typeof DailyItinerarySchema>;
export type ItineraryActivity = z.infer<typeof ItineraryActivitySchema>;
export type ActivityPlaceDetails = z.infer<typeof ActivityPlaceDetailsSchema>;


export async function generateItinerary(input: GenerateItineraryInput): Promise<GenerateItineraryOutput> {
  return generateItineraryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateItineraryPrompt',
  input: {schema: GenerateItineraryInputSchema},
  output: {schema: GenerateItineraryOutputSchema},
  tools: [findPlacesTool],
  prompt: `You are an expert travel planner. Generate a detailed, multi-day travel itinerary based on the user's input.
The output MUST be a JSON object matching the 'GenerateItineraryOutputSchema'.

User Inputs:
- Destination: {{destination}}
- Start Date: {{startDate}}
- End Date: {{endDate}}
- Number of People: {{numberOfPeople}}
- Budget: USD {{budget}}
- Preferences: {{preferences}}

Instructions:
1.  **Itinerary Title**: Create a short, catchy ` + "`itineraryTitle`" + ` for the trip.
2.  **Structured Itinerary**: Populate the ` + "`structuredItinerary`" + ` array. Each element should be a ` + "`DailyItinerarySchema`" + ` object.
    *   For each day (` + "`DailyItinerarySchema`" + `):
        *   Set ` + "`day`" + ` number.
        *   Set ` + "`date`" + ` (YYYY-MM-DD), if applicable based on start/end dates.
        *   Create a ` + "`title`" + ` for the day.
        *   Write a brief ` + "`summary`" + ` for the day's plan.
        *   Populate the ` + "`activities`" + ` array. Each element should be an ` + "`ItineraryActivitySchema`" + ` object.
            *   For each activity (` + "`ItineraryActivitySchema`" + `):
                *   Generate a unique ` + "`id`" + ` (e.g., "activity-day1-1", "activity-day1-2").
                *   Suggest a ` + "`time`" + ` (e.g., "Morning", "1:00 PM", "Evening").
                *   Write a clear and engaging ` + "`description`" + ` for the activity.
                *   **Using ` + "`findPlacesTool`" + `**: If the activity involves a specific place (restaurant, cafe, museum, park, landmark), YOU MUST use the ` + "`findPlacesTool`" + ` to find it.
                    *   Provide the tool with the ` + "`destination`" + ` (from user input) as the location, the appropriate ` + "`placeType`" + ` (e.g., "restaurant", "tourist_attraction", "cafe"), and a relevant ` + "`query`" + ` based on user preferences or the nature of the activity.
                    *   If the tool returns results, select the most suitable place.
                    *   Then, populate the ` + "`placeDetails`" + ` field of the activity with the EXACT details from the tool's output: ` + "`id`" + ` (Google Place ID), ` + "`name`" + `, ` + "`category`" + `, ` + "`latitude`" + `, ` + "`longitude`" + `, ` + "`imageUrl`" + `, and ` + "`description`" + ` (address/vicinity).
                    *   **Crucially, the activity ` + "`description`" + ` should still be engaging, but if ` + "`placeDetails`" + ` are included, the ` + "`description`" + ` should mention the place by its exact name from ` + "`placeDetails.name`" + `.**
                    *   If the tool doesn't find a suitable place or if the activity is general (e.g., "Relax at the hotel"), omit the ` + "`placeDetails`" + ` field for that activity.
                *   Add any relevant ` + "`notes`" + ` (e.g., booking info, tips, opening hours if known - but don't spend too much time finding these unless the tool provides them).

General Guidelines:
- Ensure the itinerary is diverse and considers the user's budget and preferences.
- Plan a realistic number of activities per day.
- Be creative and suggest interesting and varied experiences.
- The final output must be a single JSON object conforming to GenerateItineraryOutputSchema. Do not output any text outside this JSON structure.
- Generate unique IDs for all ` + "`ItineraryActivitySchema`" + ` objects (e.g. by combining day number and activity index: "day1-activity1", "day1-activity2").

Example of desired ` + "`placeDetails`" + ` usage within an activity:
If the user wants to visit a famous museum, and the tool returns:
{ id: "ChIJ...", name: "Louvre Museum", category: "Museum", lat: 48.8606, lng: 2.3376, imageUrl: "http://...", description: "Rue de Rivoli, 75001 Paris, France" }

Then an activity object might be:
{
  id: "day1-activity2",
  time: "Afternoon",
  description: "Immerse yourself in art at the world-renowned Louvre Museum.",
  placeDetails: {
    id: "ChIJ...",
    name: "Louvre Museum",
    category: "Museum",
    latitude: 48.8606,
    longitude: 2.3376,
    imageUrl: "http://...",
    description: "Rue de Rivoli, 75001 Paris, France"
  },
  notes: "Book tickets online in advance to avoid long queues."
}

Provide the ENTIRE response as a single JSON object.
`,
});

const generateItineraryFlow = ai.defineFlow(
  {
    name: 'generateItineraryFlow',
    inputSchema: GenerateItineraryInputSchema,
    outputSchema: GenerateItineraryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI failed to generate itinerary output.");
    }
    // Ensure `structuredItinerary` is an array, even if AI messed up.
    if (!output.structuredItinerary || !Array.isArray(output.structuredItinerary)) {
        // Attempt to provide a fallback or log an error more clearly
        console.error("AI output for structuredItinerary was not an array or was missing:", output.structuredItinerary);
        // You might want to throw a more specific error or return a default structure
        return { itineraryTitle: output.itineraryTitle || "Generated Itinerary", structuredItinerary: [] };
    }
    return output;
  }
);

    