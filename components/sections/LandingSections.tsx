import { getPublicRooms } from "@/lib/rooms/public";
import { Navbar } from "@/components/navigation/Navbar";
import { HeroSection } from "@/components/sections/HeroSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { RoomsSection } from "@/components/sections/RoomsSection";
import { WeddingSection } from "@/components/sections/WeddingSection";
import { GallerySection } from "@/components/sections/GallerySection";
import { VideoSection } from "@/components/sections/VideoSection";
import { MenuSection } from "@/components/sections/MenuSection";
import { MapSection } from "@/components/sections/MapSection";
import { ReviewsSection } from "@/components/sections/ReviewsSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { Footer } from "@/components/sections/Footer";

/**
 * The full landing-page section stack. Shared by the public homepage
 * (app/page.tsx) and the backoffice live preview (app/content-preview) so the
 * admin edits against the real page. Must be wrapped in a <ContentProvider>.
 */
export async function LandingSections() {
  const rooms = await getPublicRooms();
  return (
    <main className="relative">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <GallerySection />
      <RoomsSection rooms={rooms} />
      <WeddingSection />
      <VideoSection />
      <MenuSection />
      <MapSection />
      <ReviewsSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
