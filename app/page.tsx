import { Navbar } from "@/components/navigation/Navbar";
import { HeroSection } from "@/components/sections/HeroSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { RoomsSection } from "@/components/sections/RoomsSection";
import { GallerySection } from "@/components/sections/GallerySection";
import { VideoSection } from "@/components/sections/VideoSection";
import { MenuSection } from "@/components/sections/MenuSection";
import { MapSection } from "@/components/sections/MapSection";
import { ReviewsSection } from "@/components/sections/ReviewsSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { Footer } from "@/components/sections/Footer";

/**
 * LandCamp Villa Khao Yai — single-page landing
 *
 * Section order (per design plan):
 *   01 Navigation
 *   02 Hero
 *   03 About / Brand Story
 *   04 Rooms (horizontal carousel + modal)
 *   05 Atmosphere Gallery (bento + lightbox)
 *   06 Video Review
 *   07 Food & Drinks
 *   08 Map & Location
 *   09 Guest Reviews
 *   10 Contact + FAQ
 *   11 Footer
 */
export default function Home() {
  return (
    <main className="relative">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <GallerySection />
      <RoomsSection />
      <VideoSection />
      <MenuSection />
      <MapSection />
      <ReviewsSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
