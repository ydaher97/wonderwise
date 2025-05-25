// src/ai/flows/suggest-destinations.ts
'use server';

/**
 * @fileOverview An AI agent that suggests travel destinations based on a description of the desired trip.
 *
 * - suggestDestinations - A function that handles the destination suggestion process.
 * - SuggestDestinationsInput - The input type for the suggestDestinations function.
 * - SuggestDestinationsOutput - The return type for the suggestDestinations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestDestinationsInputSchema = z.object({
  tripDescription: z
    .string()
    .describe(
      'A description of the type of trip the user is looking for (e.g., a relaxing beach vacation, an adventurous mountain hike).' // Documentation
    ),
});
export type SuggestDestinationsInput = z.infer<typeof SuggestDestinationsInputSchema>;

const SuggestDestinationsOutputSchema = z.object({
  destinations: z.array(
    z.object({
      name: z.string().describe('The name of the destination.'),
      description: z.string().describe('A brief description of the destination.'),
      reason: z.string().describe('Why this destination is suitable based on the trip description.'),
    })
  ).describe('An array of suggested destinations.'),
});
export type SuggestDestinationsOutput = z.infer<typeof SuggestDestinationsOutputSchema>;

export async function suggestDestinations(input: SuggestDestinationsInput): Promise<SuggestDestinationsOutput> {
  return suggestDestinationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestDestinationsPrompt',
  input: {schema: SuggestDestinationsInputSchema},
  output: {schema: SuggestDestinationsOutputSchema},
  prompt: `You are a travel expert. A user is looking for a trip, and has described it like this:

"""{{tripDescription}}"""

Suggest some destinations that would be suitable for this trip. For each destination, provide a brief description and explain why it is a good fit based on the user's description.

Format your output as a JSON array of destinations. Each destination should have a name, description, and reason field.
`,
});

const suggestDestinationsFlow = ai.defineFlow(
  {
    name: 'suggestDestinationsFlow',
    inputSchema: SuggestDestinationsInputSchema,
    outputSchema: SuggestDestinationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
