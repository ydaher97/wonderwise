
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, MapPinned, LocateFixed } from "lucide-react";
import { Loader } from "@googlemaps/js-api-loader";

export interface MappableActivity {
  id: string;
  name: string;
  lat: number;
  lng: number;
  imageUrl?: string; // Added imageUrl
}

interface GoogleMapDisplayProps {
  destination: string | null;
  activities: MappableActivity[];
  hoveredActivityId: string | null;
}

export function GoogleMapDisplay({ destination, activities, hoveredActivityId }: GoogleMapDisplayProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]); 
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey) {
      setMapError("The Google Maps API key is missing. Please add it to your .env file as NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.");
      return;
    }
    setMapError(null);

    const loader = new Loader({
      apiKey: apiKey,
      version: "weekly",
      libraries: ["maps", "marker", "places"], 
    });

    loader.load().then(() => {
      setIsApiLoaded(true);
    }).catch(e => {
      console.error("Failed to load Google Maps API", e);
      setMapError("Failed to load Google Maps API. Check the console for details.");
    });
  }, [apiKey]);

  useEffect(() => {
    if (!isApiLoaded || !mapRef.current || !destination) return;

    if (!google.maps.Geocoder) {
        console.warn("Google Maps Geocoder service not available yet.");
        return;
    }
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address: destination }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
        const location = results[0].geometry.location;
        if (!googleMapRef.current) {
          googleMapRef.current = new google.maps.Map(mapRef.current!, {
            center: location,
            zoom: 12,
            mapId: "WANDERWISE_MAP_ID" 
          });
        } else {
          googleMapRef.current.setCenter(location);
        }
      } else {
        console.warn(`Geocoding failed for ${destination}: ${status}`);
        if (activities.length > 0 && !googleMapRef.current) {
           googleMapRef.current = new google.maps.Map(mapRef.current!, {
            center: { lat: activities[0].lat, lng: activities[0].lng },
            zoom: 12,
            mapId: "WANDERWISE_MAP_ID"
          });
        } else if (!googleMapRef.current) {
           googleMapRef.current = new google.maps.Map(mapRef.current!, { 
            center: { lat: 0, lng: 0 },
            zoom: 2,
            mapId: "WANDERWISE_MAP_ID"
          });
        }
      }
    });
  }, [isApiLoaded, destination, activities]); 

  useEffect(() => {
    if (!googleMapRef.current || !isApiLoaded || !google.maps.marker) {
        if (isApiLoaded && !google.maps.marker) {
            console.warn("Google Maps AdvancedMarkerElement not available yet. Check API load status and library inclusion.");
        }
        return;
    }


    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    if (activities.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    activities.forEach((activity, index) => {
      const position = { lat: activity.lat, lng: activity.lng };
      const isHovered = activity.id === hoveredActivityId;

      
      const pinGlyph = new google.maps.marker.PinElement({
        glyph: `${index + 1}`, 
        scale: isHovered ? 1.5 : 1,
        background: isHovered ? "hsl(var(--accent))" : "hsl(var(--primary))",
        borderColor: isHovered ? "hsl(var(--accent-foreground))" : "hsl(var(--primary-foreground))",
        glyphColor: isHovered ? "hsl(var(--accent-foreground))" : "hsl(var(--primary-foreground))",
      });
      
      const marker = new (google.maps.marker.AdvancedMarkerElement as any)({
        position,
        map: googleMapRef.current,
        title: activity.name,
        content: pinGlyph.element,
        zIndex: isHovered ? 100 : 1, 
      });
      
      markersRef.current.push(marker);
      bounds.extend(position);
    });

    if (activities.length > 0 && !bounds.isEmpty()) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        if (ne.equals(sw) && activities.length === 1) { 
             googleMapRef.current.setCenter(activities[0]);
             googleMapRef.current.setZoom(14);
        } else if (activities.length > 0) {
            googleMapRef.current.fitBounds(bounds, 100); 
        }
    }


  }, [activities, hoveredActivityId, isApiLoaded]); 

  if (mapError) {
    return (
      <Card className="shadow-lg border-destructive h-full">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-6 w-6" />
            <CardTitle className="text-xl">Map Error</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p>{mapError}</p>
          {apiKey && <p className="mt-2 text-sm text-muted-foreground">Ensure "Maps JavaScript API", "Geocoding API", "Marker Library" and "Places API" are enabled for your key in Google Cloud Console.</p>}
        </CardContent>
      </Card>
    );
  }
  
  if (!destination && activities.length === 0) {
    return (
      <Card className="shadow-lg h-full">
        <CardHeader>
           <div className="flex items-center gap-2 text-primary">
            <MapPinned className="h-6 w-6" />
            <CardTitle className="text-xl">Destination Map</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Itinerary details will provide locations for the map.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl overflow-hidden h-full">
       <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <MapPinned className="h-6 w-6" />
            <CardTitle className="text-xl truncate max-w-[calc(100%-3rem)]">Map of {destination || 'Activities'}</CardTitle>
          </div>
           {googleMapRef.current && activities.length > 0 && (
            <button
              onClick={() => {
                if (googleMapRef.current && activities.length > 0) {
                  const bounds = new google.maps.LatLngBounds();
                  activities.forEach(act => bounds.extend({lat: act.lat, lng: act.lng}));
                  if (!bounds.isEmpty()) googleMapRef.current.fitBounds(bounds, 100);
                }
              }}
              title="Fit activities to map"
              className="p-1.5 rounded-md hover:bg-muted"
            >
              <LocateFixed className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-4.5rem)]"> 
        <div ref={mapRef} className="w-full h-full min-h-[400px] bg-muted" />
        {!isApiLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
