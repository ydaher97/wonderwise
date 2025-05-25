
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, MapPin, Sparkles, Info } from "lucide-react";
import { useState } from "react";
import { suggestDestinations, type SuggestDestinationsOutput, type SuggestDestinationsInput } from "@/ai/flows/suggest-destinations";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const suggestDestinationsSchema = z.object({
  tripDescription: z.string().min(10, { message: "Please describe your trip in at least 10 characters." }).max(500, { message: "Description must be 500 characters or less." }),
});

type SuggestDestinationsFormValues = z.infer<typeof suggestDestinationsSchema>;

export function DestinationSuggester() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestDestinationsOutput['destinations'] | null>(null);
  const { toast } = useToast();

  const form = useForm<SuggestDestinationsFormValues>({
    resolver: zodResolver(suggestDestinationsSchema),
    defaultValues: {
      tripDescription: "",
    },
  });

  const onSubmit: SubmitHandler<SuggestDestinationsFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    setSuggestions(null);
    try {
      const result = await suggestDestinations(data);
      if (result && result.destinations) {
        setSuggestions(result.destinations);
        if(result.destinations.length === 0) {
          toast({
            title: "No specific suggestions found",
            description: "Try broadening your trip description for more results.",
          });
        }
      } else {
        throw new Error("AI did not return valid suggestions.");
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Suggestion Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="shadow-xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="tripDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-primary">What kind of trip are you dreaming of?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., A relaxing beach vacation with great food and opportunities for snorkeling."
                        className="resize-none min-h-[120px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Getting Suggestions...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Suggest Destinations
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {error && (
        <Card className="mt-8 text-center shadow-lg border-destructive">
          <CardHeader>
            <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <CardTitle className="text-xl text-destructive pt-2">Suggestion Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground break-words">{error}</p>
          </CardContent>
        </Card>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-primary">Here are some ideas for you:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {suggestions.map((suggestion, index) => {
              const destinationQuery = `destination=${encodeURIComponent(suggestion.name)}`;
              const planPageWithQuery = `/plan?${destinationQuery}`; // e.g., /plan?destination=Paris
              const planTripHref = user ? planPageWithQuery : `/login?redirect=${encodeURIComponent(planPageWithQuery)}`;
              
              return (
                <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-xl text-primary flex items-center gap-2">
                      <MapPin className="h-5 w-5" /> {suggestion.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground mb-2">{suggestion.description}</p>
                    <p className="text-sm text-accent-foreground/80 bg-accent/10 p-2 rounded-md border border-accent/20">
                      <span className="font-semibold">Why it fits:</span> {suggestion.reason}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Link href={planTripHref} passHref className="w-full">
                      <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
                        Plan a trip to {suggestion.name}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      
      {suggestions && suggestions.length === 0 && !isLoading && !error && (
         <Card className="mt-8 text-center py-12 shadow-lg">
          <CardHeader>
            <Info className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-2xl">No Specific Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-lg mb-6">
              Our AI couldn't find specific matches for your description. Try rephrasing or being a bit broader.
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
