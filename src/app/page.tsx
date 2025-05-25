
"use client"; // Add this since we use useAuth hook

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, MapPin, CalendarDays, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth

export default function HomePage() {
  const { user, loading } = useAuth(); // Get user and loading state

  const planTripHref = !loading && user ? "/plan" : "/login?redirect=/plan";

  return (
    <div className="flex flex-col items-center text-center">
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-primary/10 to-background rounded-xl shadow-lg">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <Image
              src="https://placehold.co/1200x800.png"
              alt="Travel collage"
              width={1200}
              height={800}
              className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square shadow-md"
              data-ai-hint="travel collage"
            />
            <div className="flex flex-col justify-center space-y-6 text-left">
              <div className="space-y-3">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                  Welcome to WanderWise
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Your personal AI travel assistant. Effortlessly plan your dream vacations with customized itineraries, tailored to your preferences and budget.
                </p>
              </div>
              <Link href={planTripHref} passHref>
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground group w-full sm:w-auto" disabled={loading}>
                  {loading ? "Loading..." : "Start Planning Your Trip"}
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mb-12">
            How It Works
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="shadow-md hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="items-center">
                <MapPin className="h-12 w-12 text-primary mb-4" />
                <CardTitle>1. Tell Us Your Dreams</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Input your destination, travel dates, party size, budget, and what you love to do.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="shadow-md hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-primary mb-4 lucide lucide-wand-sparkles"><path d="M14.5 2H18a2 2 0 0 1 2 2v9.5c0 .8-.7 1.5-1.5 1.5H17a1.5 1.5 0 0 1-1.5-1.5V2zM5 2h1.5v19.5H5A2.5 2.5 0 0 1 2.5 19V4.5A2.5 2.5 0 0 1 5 2z"/><path d="M8 2h1.5v19.5H8A2.5 2.5 0 0 1 5.5 19V4.5A2.5 2.5 0 0 1 8 2zM14.5 2H18a2 2 0 0 1 2 2v9.5c0 .8-.7 1.5-1.5 1.5H17a1.5 1.5 0 0 1-1.5-1.5V2z"/><path d="m21.64 3.64-.28-.28a1.32 1.32 0 0 0-1.87 0l-1.21 1.21a1.32 1.32 0 0 0 0 1.87l.28.28a1.32 1.32 0 0 0 1.87 0l1.21-1.21a1.32 1.32 0 0 0 0-1.87z"/><path d="M14.5 11.5h.01"/><path d="M18.5 7.5h.01"/></svg>
                <CardTitle>2. AI Magic Happens</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Our intelligent AI processes your inputs to craft a unique, personalized itinerary just for you.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="shadow-md hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="items-center">
                <CalendarDays className="h-12 w-12 text-primary mb-4" />
                <CardTitle>3. Explore Your Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Receive a detailed, day-by-day schedule with activities, suggestions, and more.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
