export interface Listing {
  id: string;
  source: string;
  title: string;
  address: string;
  neighborhood: string;
  borough: string;
  city: string;
  state: string;
  zip_code: string | null;
  lat: number;
  lon: number;
  price: number;
  bedrooms: number;
  bathrooms: number | null;
  sqft: number | null;
  listing_url: string | null;
  images: string[];
  amenities: string[];
  description: string | null;
  available_date: string | null;
  transit_score: number | null;
  walk_score: number | null;
  is_active: boolean;
  created_at: string;
}

export interface ListingFilters {
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
  max_bedrooms?: number;
  boroughs?: string[];
  neighborhoods?: string[];
}

export interface Alert {
  id: string;
  name: string;
  email: string;
  min_price: number | null;
  max_price: number | null;
  min_bedrooms: number | null;
  max_bedrooms: number | null;
  boroughs: string[];
  neighborhoods: string[];
  required_amenities: string[];
  work_address: string | null;
  max_commute_minutes: number | null;
  is_active: boolean;
  last_checked: string | null;
  created_at: string;
}

export interface AlertCreate {
  name: string;
  email: string;
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
  max_bedrooms?: number;
  boroughs: string[];
  neighborhoods: string[];
  required_amenities: string[];
  work_address?: string;
  max_commute_minutes?: number;
}

export interface Neighborhood {
  id: string;
  name: string;
  borough: string;
  lat: number;
  lon: number;
  avg_rent_studio: number | null;
  avg_rent_1br: number | null;
  avg_rent_2br: number | null;
  transit_score: number | null;
  walk_score: number | null;
  bike_score: number | null;
  subway_lines: string[];
  nearby_stations: Array<{ name: string; lines: string[] }>;
  description: string | null;
  vibe_tags: string[];
}

export interface NeighborhoodScore {
  neighborhood: Neighborhood;
  commute_minutes: number | null;
  commute_description: string;
  score: number;
  score_breakdown: Record<string, number>;
  active_listings: number;
}

export interface Stats {
  total_active: number;
  avg_rent: number;
  by_borough: Record<string, number>;
}

export const BOROUGHS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island", "Jersey City"];
export const BEDROOM_OPTIONS = [
  { label: "Studio", value: 0 },
  { label: "1 BR", value: 1 },
  { label: "2 BR", value: 2 },
  { label: "3+ BR", value: 3 },
];
