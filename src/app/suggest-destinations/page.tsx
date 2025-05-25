
import { DestinationSuggester } from "@/components/domain/destination-suggester";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

export default function SuggestDestinationsPage() {
  return (
    <div className="py-8">
      <Card className="w-full max-w-3xl mx-auto shadow-xl mb-8">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-3">
            <Lightbulb className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Need Inspiration?</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Describe your dream trip, and let our AI suggest some perfect destinations for you!
          </CardDescription>
        </CardHeader>
      </Card>
      <DestinationSuggester />
    </div>
  );
}
