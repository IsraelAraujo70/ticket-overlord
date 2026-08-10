import { EventLineup } from "@/components/organisms/event-lineup";
import { HowItWorks } from "@/components/organisms/how-it-works";
import { LandingHero } from "@/components/organisms/landing-hero";
import { PublicTemplate } from "@/components/templates/public-template";

export default function HomePage() {
  return (
    <PublicTemplate>
      <LandingHero />
      <EventLineup />
      <HowItWorks />
    </PublicTemplate>
  );
}
