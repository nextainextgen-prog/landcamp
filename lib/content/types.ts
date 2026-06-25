/**
 * Site content (CMS) types — client-safe, no server imports.
 *
 * `SiteContent` is the full resolved content tree the public site renders from.
 * The database stores only a `DeepPartial<SiteContent>` override, which is
 * deep-merged over the code-level defaults (see lib/content/defaults.ts) so a
 * missing field always falls through to the original hardcoded value.
 */

export type Bilingual = { th: string; en: string };

export type AboutStat = {
  value: number;
  decimals?: number;
  unit?: Bilingual;
  label: Bilingual;
};

/** A gallery image — `src` is a path under /public or a Storage public URL. */
export type GalleryImage = {
  src: string;
  alt: string;
};

/** A "story" slide in the About section carousel. */
export type StorySlide = {
  src: string;
  alt: string;
  title: Bilingual;
  subtitle: Bilingual;
};

/** A guest video reel in the Video section. */
export type VideoClip = {
  src: string;
  title: Bilingual;
  handle: string;
  tag: Bilingual;
};

/** A category row of food photos in the Menu section. */
export type MenuRow = {
  id: string;
  label: Bilingual;
  images: GalleryImage[];
};

export type SiteContent = {
  brand: {
    name: string;
    nameFull: string;
    nameThai: string;
    tagline: Bilingual;
    description: Bilingual;
  };
  /** Contact / NAP — defaults mirror data/siteConfig.ts contact block. */
  contact: {
    phone: string;
    phoneAlt: string;
    phoneE164: string;
    line: string;
    lineUrl: string;
    facebook: string;
    instagram: string;
    googleMaps: string;
    email: string;
  };
  hero: {
    eyebrow: Bilingual;
    subheadLine1: Bilingual;
    subheadLine2: Bilingual;
    ctaReserve: Bilingual;
    ctaExplore: Bilingual;
  };
  about: {
    eyebrow: Bilingual;
    description: Bilingual;
    stats: AboutStat[];
    perks: { label: Bilingual }[];
    story: StorySlide[];
  };
  contactSection: {
    eyebrow: Bilingual;
    heading: Bilingual;
    lead: Bilingual;
  };
  footer: {
    brandDescription: Bilingual;
    copyrightTagline: Bilingual;
  };
  /** Atmosphere gallery shown on the homepage (two auto-scrolling rows). */
  gallery: GalleryImage[];
  wedding: {
    eyebrow: Bilingual;
    heading: Bilingual;
    description: Bilingual;
    highlights: Bilingual[];
    ctaLabel: Bilingual;
    images: GalleryImage[];
  };
  video: {
    eyebrow: Bilingual;
    heading: Bilingual;
    lead: Bilingual;
    clips: VideoClip[];
  };
  menu: {
    eyebrow: Bilingual;
    heading: Bilingual;
    lead: Bilingual;
    rows: MenuRow[];
  };
  reviews: {
    eyebrow: Bilingual;
    heading: Bilingual;
    ratingValue: number;
    ratingCount: number;
  };
  map: {
    eyebrow: Bilingual;
    titleLine1: Bilingual;
    titleLine2: Bilingual;
    directionsLabel: Bilingual;
    directions: { text: Bilingual; distance: Bilingual }[];
  };
};

export type DeepPartial<T> = T extends (infer U)[]
  ? DeepPartial<U>[]
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

export type SiteContentOverride = DeepPartial<SiteContent>;

/** Keys editable as discrete tabs in the admin content editor. */
export type ContentSectionKey = keyof SiteContent;
