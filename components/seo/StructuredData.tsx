import { siteConfig } from "@/data/siteConfig";
import { featuredReviews } from "@/data/reviews";
import { faqItems } from "@/data/faq";
import { rooms } from "@/data/rooms";

/**
 * Schema.org JSON-LD payload — emitted in the document head.
 *
 * Coverage:
 *  - LodgingBusiness (primary — for hotels/villas)
 *  - LocalBusiness (sibling — for local search panels)
 *  - AggregateRating (Google rich result)
 *  - Review[] (Google rich result)
 *  - FAQPage (Google FAQ rich result + AEO)
 *  - BreadcrumbList (Sitelinks)
 *
 * All NAP data is pulled from siteConfig — single source of truth.
 */
export function StructuredData() {
  const lodgingBusiness = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "@id": `${siteConfig.seo.siteUrl}#lodging`,
    name: siteConfig.brand.nameFull,
    alternateName: siteConfig.brand.nameThai,
    description: siteConfig.brand.description.en,
    url: siteConfig.seo.siteUrl,
    image: [
      `${siteConfig.seo.siteUrl}/og-image.jpg`,
      `${siteConfig.seo.siteUrl}/images/hero/hero-main.jpg`,
    ],
    telephone: siteConfig.contact.phoneE164,
    email: siteConfig.contact.email,
    priceRange: `฿${siteConfig.inventory.priceFromTHB.toLocaleString()}+`,
    currenciesAccepted: "THB",
    paymentAccepted: "Cash, Bank Transfer, PromptPay",
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address.streetEn,
      addressLocality: siteConfig.address.cityEn,
      addressRegion: siteConfig.address.stateEn,
      postalCode: siteConfig.address.postalCode,
      addressCountry: "TH",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: siteConfig.address.coordinates.lat,
      longitude: siteConfig.address.coordinates.lng,
    },
    sameAs: [
      siteConfig.contact.facebook,
      siteConfig.contact.instagram,
      siteConfig.contact.googleMaps,
    ],
    checkinTime: siteConfig.policy.checkIn,
    checkoutTime: siteConfig.policy.checkOut,
    petsAllowed: siteConfig.policy.pets,
    numberOfRooms: siteConfig.inventory.totalRooms,
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Free WiFi", value: true },
      { "@type": "LocationFeatureSpecification", name: "Breakfast included", value: true },
      { "@type": "LocationFeatureSpecification", name: "Free parking", value: true },
      { "@type": "LocationFeatureSpecification", name: "Private bathroom", value: true },
      { "@type": "LocationFeatureSpecification", name: "Air conditioning", value: true },
      { "@type": "LocationFeatureSpecification", name: "Outdoor bath", value: true },
      { "@type": "LocationFeatureSpecification", name: "BBQ facilities", value: true },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: siteConfig.rating.value,
      reviewCount: siteConfig.rating.count,
      bestRating: 5,
      worstRating: 1,
    },
    makesOffer: rooms.map((r) => ({
      "@type": "Offer",
      name: r.name.en,
      description: r.description.en,
      priceCurrency: "THB",
      price: r.priceWeekday,
      eligibleQuantity: {
        "@type": "QuantitativeValue",
        unitText: "night",
      },
      availability: r.available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    })),
  };

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteConfig.seo.siteUrl}#local`,
    name: siteConfig.brand.nameFull,
    image: `${siteConfig.seo.siteUrl}/og-image.jpg`,
    telephone: siteConfig.contact.phoneE164,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address.streetEn,
      addressLocality: siteConfig.address.cityEn,
      addressRegion: siteConfig.address.stateEn,
      postalCode: siteConfig.address.postalCode,
      addressCountry: "TH",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: siteConfig.address.coordinates.lat,
      longitude: siteConfig.address.coordinates.lng,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "00:00",
        closes: "23:59",
      },
    ],
  };

  const reviewSchemas = featuredReviews.slice(0, 5).map((r) => ({
    "@context": "https://schema.org",
    "@type": "Review",
    author: { "@type": "Person", name: r.reviewerName },
    datePublished: r.date,
    reviewBody: r.text.en,
    reviewRating: {
      "@type": "Rating",
      ratingValue: r.rating,
      bestRating: 5,
      worstRating: 1,
    },
    itemReviewed: {
      "@type": "LodgingBusiness",
      name: siteConfig.brand.nameFull,
      "@id": `${siteConfig.seo.siteUrl}#lodging`,
    },
  }));

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({
      "@type": "Question",
      name: f.question.en,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer.en,
      },
    })),
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteConfig.seo.siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "LandCamp Villa Khao Yai",
        item: siteConfig.seo.siteUrl,
      },
    ],
  };

  const payload = [
    lodgingBusiness,
    localBusiness,
    ...reviewSchemas,
    faqPage,
    breadcrumbs,
  ];

  return (
    <script
      type="application/ld+json"
      // Schema.org JSON is content, not user input; safe to dangerouslySetInnerHTML.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
