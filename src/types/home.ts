export type BenefitIcon = "fresh" | "verified" | "quote" | "contact";

export interface HomeBenefit {
  title: string;
  description: string;
  icon: BenefitIcon;
}

export interface HeroSlide {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  icon: "market" | "specialists" | "business";
}

export interface HomeCategory {
  name: string;
  description: string;
  image: string;
  href: string;
}

export interface DemoMerchant {
  name: string;
  category: string;
  image: string;
  imageAlt: string;
  href: string;
  verified: boolean;
}

export interface DemoProduct {
  name: string;
  price: string;
  unit: string;
  image: string;
  imageAlt: string;
  href: string;
}

export interface DemoAnnouncement {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
}
