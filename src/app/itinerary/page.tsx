import { ItineraryDisplay } from "@/components/domain/itinerary-display";

export default function ItineraryPage() {
  return (
    <div className="py-8">
      {/* The ItineraryDisplay component now handles its own grid layout for map and details */}
      <ItineraryDisplay />
    </div>
  );
}
