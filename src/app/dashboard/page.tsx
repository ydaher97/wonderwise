
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useItineraryStore } from "@/lib/store";
import { getUserItineraries } from "@/services/itinerary-service";
import type { SavedItinerary } from "@/types/itinerary";
import type { GenerateItineraryOutput } from "@/ai/flows/generate-itinerary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CalendarDays, MapPin, PlusCircle, Info, Users, CircleDollarSign } from "lucide-react";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

// Define the type for itineraries fetched from the service, which includes structuredItinerary
type FetchedItinerary = SavedItinerary & { structuredItinerary: GenerateItineraryOutput['structuredItinerary'] };

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { setLoadedItinerary, clearItinerary } = useItineraryStore();
  const [itineraries, setItineraries] = useState<FetchedItinerary[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/dashboard");
    } else if (user) {
      clearItinerary(); 
      fetchItineraries();
    }
  }, [user, authLoading, router]);

  const fetchItineraries = async () => {
    if (!user) return;
    setIsLoadingData(true);
    try {
      const userItineraries = await getUserItineraries(user.uid);
      setItineraries(userItineraries);
    } catch (error) {
      console.error("Error fetching itineraries:", error);
      toast({
        variant: "destructive",
        title: "Failed to load trips",
        description: "Could not retrieve your saved itineraries. Please try again later.",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleViewItinerary = (itinerary: FetchedItinerary) => {
    setLoadedItinerary(itinerary); // Pass the full fetched itinerary object
    router.push("/itinerary");
  };

  if (authLoading || (!user && !authLoading)) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-xl font-semibold mt-4 text-primary">Loading Dashboard...</p>
      </div>
    );
  }
  
  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">My Trips</h1>
        <Link href="/plan" passHref>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <PlusCircle className="mr-2 h-5 w-5" /> Plan New Trip
          </Button>
        </Link>
      </div>

      {isLoadingData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="shadow-lg">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-1/2 mt-1 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full mb-2 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
              </CardContent>
              <CardFooter>
                <div className="h-10 bg-muted rounded w-full animate-pulse"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!isLoadingData && itineraries.length === 0 && (
        <Card className="text-center py-12 shadow-lg">
          <CardHeader>
            <Info className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-2xl">No Trips Yet!</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-lg mb-6">
              You haven&apos;t planned any trips with WanderWise.
            </CardDescription>
            <Link href="/plan" passHref>
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                Start Planning Your First Trip
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!isLoadingData && itineraries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {itineraries.map((itinerary) => (
            <Card key={itinerary.id} className="flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-xl text-primary truncate">{itinerary.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {itinerary.destination}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    <span>{format(parseISO(itinerary.startDate), "MMM d, yyyy")} - {format(parseISO(itinerary.endDate), "MMM d, yyyy")}</span>
                  </div>
                   <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{itinerary.numberOfPeople} {itinerary.numberOfPeople === 1 ? 'person' : 'people'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CircleDollarSign className="h-4 w-4" />
                    <span>Budget: ${itinerary.budget.toLocaleString()}</span>
                  </div>
                </div>
                 <p className="mt-3 text-xs text-muted-foreground/80">
                    Created: {format(parseISO(itinerary.createdAt), "MMM d, yyyy 'at' h:mm a")}
                 </p>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleViewItinerary(itinerary)}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  View Itinerary
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

    