
"use client";

import type { GenerateItineraryInput, GenerateItineraryOutput } from "@/ai/flows/generate-itinerary";
import { generateItinerary } from "@/ai/flows/generate-itinerary";
import { useItineraryStore } from "@/lib/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation"; // Import useSearchParams
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CalendarIcon, MapPin, Users, CircleDollarSign, ListFilter, Loader2, AlertTriangle } from "lucide-react";
import { format, addDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import React, { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { useAuth } from "@/contexts/AuthContext";
import { saveItinerary } from "@/services/itinerary-service";
import type { NewItineraryData } from "@/types/itinerary";

const GenerateItineraryFormSchema = z.object({
  destination: z.string().min(2, { message: "Destination must be at least 2 characters." }),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  numberOfPeople: z.coerce.number().int().min(1, { message: "At least 1 person." }),
  budget: z.coerce.number().min(0, { message: "Budget cannot be negative." }),
  preferences: z.string().min(5, { message: "Preferences must be at least 5 characters." }),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});


export function TripForm() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Get search params
  const { user } = useAuth();
  const { setGeneratedItinerary, setIsLoading, setError, clearItinerary } = useItineraryStore();
  const { toast } = useToast();
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const [mapsApiKey, setMapsApiKey] = useState<string | undefined>(undefined);
  const [isMapsApiLoaded, setIsMapsApiLoaded] = useState(false);

  useEffect(() => {
    setMapsApiKey(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  }, []);

  const initialDestination = searchParams.get('destination') || "";

  const form = useForm<z.infer<typeof GenerateItineraryFormSchema>>({
    resolver: zodResolver(GenerateItineraryFormSchema),
    defaultValues: {
      destination: initialDestination,
      startDate: new Date(),
      endDate: addDays(new Date(), 7),
      numberOfPeople: 1,
      budget: 1000,
      preferences: "",
    },
  });

  const { isSubmitting } = form.formState;

  // Effect to update destination if query param changes after initial load
  useEffect(() => {
    const destinationQueryParam = searchParams.get('destination');
    if (destinationQueryParam && form.getValues('destination') !== destinationQueryParam) {
      form.setValue("destination", destinationQueryParam, { shouldValidate: true });
    }
  }, [searchParams, form]);


  useEffect(() => {
    if (!mapsApiKey || !destinationInputRef.current) {
      return;
    }

    const loader = new Loader({
      apiKey: mapsApiKey,
      version: "weekly",
      libraries: ["maps", "marker", "places"], 
    });

    loader.load().then((google) => {
      setIsMapsApiLoaded(true);
      if (!destinationInputRef.current) return;
      const autocomplete = new google.maps.places.Autocomplete(
        destinationInputRef.current,
        {
          types: ["geocode"], 
        }
      );
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place && place.formatted_address) {
          form.setValue("destination", place.formatted_address, { shouldValidate: true });
        } else if (place && place.name) {
          form.setValue("destination", place.name, { shouldValidate: true });
        }
      });
    }).catch(e => {
      console.error("Failed to load Google Maps API for Places Autocomplete", e);
      setIsMapsApiLoaded(false); 
    });
  }, [mapsApiKey, form]);


  async function onSubmit(values: z.infer<typeof GenerateItineraryFormSchema>) {
    setIsLoading(true);
    clearItinerary(); 

    const formattedStartDate = format(values.startDate, "yyyy-MM-dd");
    const formattedEndDate = format(values.endDate, "yyyy-MM-dd");

    try {
      const aiInput: GenerateItineraryInput = {
        destination: values.destination,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        numberOfPeople: values.numberOfPeople,
        budget: values.budget,
        preferences: values.preferences,
      };
      const aiResult: GenerateItineraryOutput = await generateItinerary(aiInput);
      
      let itineraryId: string | null = null;
      let savedCreatedAt: string | undefined = undefined;

      if (user) {
        const itineraryToSave: NewItineraryData = {
          name: aiResult.itineraryTitle, 
          destination: values.destination,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          numberOfPeople: values.numberOfPeople,
          budget: values.budget,
          preferences: values.preferences,
          itineraryText: JSON.stringify(aiResult.structuredItinerary), 
        };
        try {
          itineraryId = await saveItinerary(user.uid, itineraryToSave);
          savedCreatedAt = new Date().toISOString();
          toast({
            title: "Itinerary Saved!",
            description: "Your new trip plan has been saved to your account.",
          });
        } catch (saveError: any) {
          console.error("Failed to save itinerary:", saveError);
          toast({
            variant: "destructive",
            title: "Save Failed",
            description: saveError?.message || "Could not save your itinerary. Please try again.",
          });
        }
      }

      setGeneratedItinerary({
        aiOutput: aiResult,
        formInput: {
          destination: values.destination,
          budget: values.budget,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          numberOfPeople: values.numberOfPeople,
          preferences: values.preferences,
        },
        savedId: itineraryId || undefined,
        savedCreatedAt: savedCreatedAt,
      });
      router.push("/itinerary");
    } catch (error) {
      console.error("Failed to generate itinerary:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error Generating Itinerary",
        description: "Could not generate your travel plan. " + errorMessage,
      });
      setIsLoading(false); 
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-primary">Plan Your Next Adventure</CardTitle>
        <CardDescription>Fill in your trip details below and let our AI craft the perfect itinerary for you!</CardDescription>
      </CardHeader>
      {!mapsApiKey && (
        <CardContent>
          <div className="p-4 mb-4 text-sm text-destructive-foreground bg-destructive/10 border border-destructive rounded-md flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 mt-0.5 text-destructive flex-shrink-0" />
            <div>
              <p className="font-semibold">Google Maps API Key Missing</p>
              <p>
                The Google Places Autocomplete feature for destinations is disabled. Please add your <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to the <code>.env</code> file.
                Make sure the "Places API" is enabled for your key in the Google Cloud Console.
              </p>
            </div>
          </div>
        </CardContent>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-lg"><MapPin className="w-5 h-5 text-primary" /> Destination</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Paris, France" 
                      {...field} 
                      ref={destinationInputRef} 
                      className="text-base"
                      disabled={!mapsApiKey && !isMapsApiLoaded} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-2 text-lg"><CalendarIcon className="w-5 h-5 text-primary" /> Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal text-base h-11",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-2 text-lg"><CalendarIcon className="w-5 h-5 text-primary" /> End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal text-base h-11",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                           disabled={(date) => date < (form.getValues("startDate") || new Date(new Date().setHours(0,0,0,0)))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="numberOfPeople"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-lg"><Users className="w-5 h-5 text-primary" /> Number of People</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 2" {...field} className="text-base"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-lg"><CircleDollarSign className="w-5 h-5 text-primary" /> Budget (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 1500" {...field} className="text-base"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="preferences"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-lg"><ListFilter className="w-5 h-5 text-primary" /> Preferences</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Interested in historical sites, local cuisine, and museums. Prefer a mix of guided tours and free exploration time."
                      className="resize-none text-base min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg" disabled={isSubmitting || (!mapsApiKey && !isMapsApiLoaded && form.getValues("destination") === "")}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Itinerary...
                </>
              ) : (
                "Generate My Itinerary"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
