'use server';
/**
 * @fileOverview Summarizes user reviews and ratings for an itinerary activity.
 *
 * - summarizeActivityReviews - A function that handles the summarization process.
 * - SummarizeActivityReviewsInput - The input type for the summarizeActivityReviews function.
 * - SummarizeActivityReviewsOutput - The return type for the summarizeActivityReviews function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeActivityReviewsInputSchema = z.object({
  activityName: z.string().describe('The name of the activity.'),
  reviews: z.array(z.string()).describe('An array of user reviews for the activity.'),
});
export type SummarizeActivityReviewsInput = z.infer<typeof SummarizeActivityReviewsInputSchema>;

const SummarizeActivityReviewsOutputSchema = z.object({
  summary: z.string().describe('A summary of the recent user reviews and ratings for the activity.'),
});
export type SummarizeActivityReviewsOutput = z.infer<typeof SummarizeActivityReviewsOutputSchema>;

export async function summarizeActivityReviews(input: SummarizeActivityReviewsInput): Promise<SummarizeActivityReviewsOutput> {
  return summarizeActivityReviewsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeActivityReviewsPrompt',
  input: {schema: SummarizeActivityReviewsInputSchema},
  output: {schema: SummarizeActivityReviewsOutputSchema},
  prompt: `You are a helpful AI assistant that summarizes user reviews for activities.

  Summarize the following reviews for the activity named "{{activityName}}":

  {{#if reviews}}
    {{#each reviews}}
  - {{{this}}}
    {{/each}}
  {{else}}
  No reviews provided. If this is a well-known attraction, you can provide a general positive sentiment. Otherwise, state that no specific review data is available.
  {{/if}}
  `,
});

const summarizeActivityReviewsFlow = ai.defineFlow(
  {
    name: 'summarizeActivityReviewsFlow',
    inputSchema: SummarizeActivityReviewsInputSchema,
    outputSchema: SummarizeActivityReviewsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
