"use client";

import { useItineraryStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, RotateCcw, ClipboardList, FileText, CheckSquare, CircleDollarSign, MapPin, CalendarDays, Users } from "lucide-react";
import { GoogleMapDisplay, MappableActivity } from "./google-map-display";
import Image from "next/image"; // Keep NextImage for place images
import { format, parseISO } from "date-fns";
import type { DailyItinerary, ItineraryActivity, ActivityPlaceDetails } from "@/ai/flows/generate-itinerary";

export function ItineraryDisplay() {
  const { 
    structuredItinerary,
    itineraryTitle,
    destination, 
    budget, 
    isLoading, 
    error, 
    itineraryId, 
    startDate, 
    endDate, 
    numberOfPeople,
    preferences,
    createdAt 
  } = useItineraryStore();
  const router = useRouter();
  const [hoveredActivityId, setHoveredActivityId] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if essential data is missing and not loading/error
    if (!isLoading && !error && !structuredItinerary && !destination && budget === null) {
      router.replace("/plan");
    }
  }, [isLoading, error, structuredItinerary, destination, budget, router]);

  const mappableActivities = useMemo(() => {
    if (!structuredItinerary) return [];
    const activities: MappableActivity[] = [];
    structuredItinerary.forEach(day => {
      day.activities.forEach(activity => {
        if (activity.placeDetails && activity.placeDetails.latitude && activity.placeDetails.longitude) {
          activities.push({
            id: activity.id, // Use the activity's own unique ID
            name: activity.placeDetails.name,
            lat: activity.placeDetails.latitude,
            lng: activity.placeDetails.longitude,
            imageUrl: activity.placeDetails.imageUrl,
          });
        }
      });
    });
    return activities;
  }, [structuredItinerary]);
  console.log(mappableActivities);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-primary lucide lucide-loader-circle"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        <p className="text-xl font-semibold mt-4 text-primary">Crafting your adventure...</p>
        <p className="text-muted-foreground">Please wait while we generate your personalized itinerary.</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto text-center shadow-lg border-destructive">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive pt-2">Oops! Something went wrong.</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground mb-4">We encountered an error while generating your itinerary:</p>
          <p className="text-sm bg-destructive/5 p-3 rounded-md border border-destructive/20 text-destructive-foreground break-words">{error}</p>
        </CardContent>
        <CardFooter> 
          <Button onClick={() => router.push("/plan")} variant="destructive" size="lg">
            <RotateCcw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  if (!structuredItinerary || !destination || budget === null) {
     return (
       <Card className="w-full max-w-2xl mx-auto text-center shadow-lg">
        <CardHeader>
           <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
            <FileText className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-primary pt-2">No Itinerary Data Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            It looks like there's no complete itinerary data to display. Please go back and plan your trip or check your dashboard.
          </p>
           <div className="flex gap-4 justify-center">
            <Link href="/plan">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">Plan a New Trip</Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline">My Trips</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formattedStartDate = startDate ? format(parseISO(startDate), "MMM d, yyyy") : "N/A";
  const formattedEndDate = endDate ? format(parseISO(endDate), "MMM d, yyyy") : "N/A";
  const formattedCreatedAt = createdAt ? format(parseISO(createdAt.toString()), "MMM d, yyyy 'at' h:mm a") : "Not saved";


  return (
    <div className="grid md:grid-cols-3 gap-8 items-start">
      <Card className="w-full shadow-2xl overflow-hidden md:col-span-2">
        <CardHeader className="bg-primary/10">
           <div className="flex items-center gap-3">
            <ClipboardList className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl font-bold text-primary">{itineraryTitle || `Trip to ${destination}`}</CardTitle>
              <CardDescription className="text-primary/80">For: <span className="font-semibold">{destination}</span>
              {itineraryId && <span className="text-xs block"> (Saved: {formattedCreatedAt})</span>}
              </CardDescription>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm text-primary/90">
            {startDate && endDate && (
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4"/> <span>{formattedStartDate} - {formattedEndDate}</span>
              </div>
            )}
            {numberOfPeople && (
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4"/> <span>{numberOfPeople} {numberOfPeople === 1 ? 'person' : 'people'}</span>
              </div>
            )}
            {budget && (
              <div className="flex items-center gap-1.5">
                <CircleDollarSign className="h-4 w-4"/> <span>Budget: ${budget.toLocaleString()}</span>
              </div>
            )}
          </div>
          {preferences && (
             <p className="mt-2 text-xs text-primary/70 italic">Preferences: {preferences}</p>
          )}
        </CardHeader>
        <CardContent className="p-6 md:p-8 max-h-[70vh] overflow-y-auto">
          {structuredItinerary && structuredItinerary.length > 0 ? (
            <div className="space-y-6">
              {structuredItinerary.map((day: DailyItinerary) => (
                <div key={`day-${day.day}`}>
                  <div className="pt-4 pb-2 mt-2 first:mt-0">
                    <h2 className="text-2xl font-semibold text-primary border-b-2 border-primary/30 pb-2 flex justify-between items-center">
                      <span>Day {day.day}{day.title ? `: ${day.title}` : ''}</span>
                      {day.date && <span className="text-sm font-normal text-muted-foreground">{format(parseISO(day.date), "MMM d, yyyy")}</span>}
                    </h2>
                    {day.summary && <p className="text-sm text-muted-foreground mt-1 italic">{day.summary}</p>}
                  </div>
                  <div className="space-y-4 mt-3">
                    {day.activities.map((activity: ItineraryActivity) => (
                       <Card 
                        key={activity.id} 
                        className={`shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-[1.01] bg-card ${hoveredActivityId === activity.id && activity.placeDetails ? 'ring-2 ring-accent' : ''}`}
                        onMouseEnter={() => activity.placeDetails && setHoveredActivityId(activity.id)}
                        onMouseLeave={() => setHoveredActivityId(null)}
                      >
                        <CardContent className="p-0">
                          {/* {activity.placeDetails?.imageUrl && (
                            <div className="relative w-full h-48 rounded-t-lg overflow-hidden">
                              <Image 
                                src={activity.placeDetails.imageUrl} 
                                alt={activity.placeDetails.name || activity.description}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                style={{objectFit: "cover"}}
                                data-ai-hint={`${activity.placeDetails.category || 'activity'} ${activity.placeDetails.name?.split(' ').slice(0,2).join(' ')}`}
                                priority={false}
                                onError={(e) => {
                                  // Replace the failed image with a placeholder
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/placeholder-image.jpg'; // Make sure to add a placeholder image in your public folder
                                }}
                              />
                            </div>
                          )} */}
                          <div className="p-4">
                            <div className="flex items-start gap-3">
                              {activity.placeDetails ? <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" /> : <CheckSquare className="h-5 w-5 text-primary mt-1 flex-shrink-0" />}
                              <div className="flex-grow">
                                {activity.time && <p className="text-xs text-muted-foreground font-semibold mb-0.5 uppercase tracking-wider">{activity.time}</p>}
                                <p className="text-foreground font-medium">
                                  {activity.description}
                                  {activity.placeDetails?.name && activity.description.toLowerCase().includes(activity.placeDetails.name.toLowerCase()) ? '' : activity.placeDetails?.name ? ` at ${activity.placeDetails.name}` : ''}
                                </p>
                                {activity.placeDetails?.category && <p className="text-xs text-muted-foreground capitalize">{activity.placeDetails.category.replace(/_/g, ' ')}</p>}
                                {activity.placeDetails?.description && !activity.placeDetails.imageUrl && <p className="text-xs text-muted-foreground mt-1">{activity.placeDetails.description}</p>}
                                {activity.notes && <p className="text-xs text-amber-700 dark:text-amber-500 mt-2 p-2 bg-amber-50 dark:bg-amber-900/30 rounded-md">Note: {activity.notes}</p>}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center">Your itinerary details will appear here.</p>
          )}
        </CardContent>
        <CardFooter className="bg-muted/30 border-t p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
           <Link href="/dashboard">
             <Button variant="outline" className="text-primary border-primary hover:bg-primary/5 hover:text-primary font-semibold">
                My Trips
            </Button>
          </Link>
          <Link href="/plan">
            <Button variant="outline" className="text-primary border-primary hover:bg-primary/5 hover:text-primary font-semibold">
              <RotateCcw className="mr-2 h-4 w-4" /> Plan Another Trip
            </Button>
          </Link>
        </CardFooter>
      </Card>
      <div className="md:col-span-1 md:sticky md:top-24 h-full min-h-[500px] md:min-h-[calc(100vh-7rem)]">
        <GoogleMapDisplay 
          destination={destination} 
          activities={mappableActivities}
          hoveredActivityId={hoveredActivityId}
        />
      </div>
    </div>
  );
}

    