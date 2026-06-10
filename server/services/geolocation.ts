import { ENV } from "../_core/env";

export interface GeocodingResult {
  zipCode: string;
  city: string;
  state: string;
  formattedAddress: string;
}

export async function reverseGeocodeToZip(
  latitude: number,
  longitude: number
): Promise<GeocodingResult | null> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  if (!ENV.googleMapsApiKey) {
    console.warn(
      "[Geolocation] GOOGLE_MAPS_API_KEY not configured. Reverse geocoding will use fallback API only."
    );
    return null;
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("latlng", `${latitude},${longitude}`);
    url.searchParams.set("key", ENV.googleMapsApiKey);

    const response = await fetch(url.toString());
    if (!response.ok) return null;

    const result = (await response.json()) as {
      results: Array<{
        address_components: Array<{
          long_name: string;
          short_name: string;
          types: string[];
        }>;
        formatted_address: string;
      }>;
      status: string;
    };

    if (result.status !== "OK" || !result.results?.[0]) {
      console.warn("[Geolocation] Reverse geocode failed:", result.status);
      return null;
    }

    const location = result.results[0];
    const components = location.address_components;

    const zipCodeComponent = components.find(c =>
      c.types.includes("postal_code")
    );
    const cityComponent = components.find(
      c => c.types.includes("locality") || c.types.includes("sublocality")
    );
    const stateComponent = components.find(c =>
      c.types.includes("administrative_area_level_1")
    );

    if (!zipCodeComponent) {
      console.warn("[Geolocation] No postal code found in geocode result");
      return null;
    }

    return {
      zipCode: zipCodeComponent.short_name.slice(0, 5),
      city: cityComponent?.long_name ?? "",
      state: stateComponent?.short_name ?? "",
      formattedAddress: location.formatted_address,
    };
  } catch (error) {
    console.warn("[Geolocation] Reverse geocode error:", error);
    return null;
  }
}

export async function reverseGeocodeToZipFallback(
  latitude: number,
  longitude: number
): Promise<string | null> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.zippopotam.us/us/${latitude},${longitude}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!response.ok) return null;
    const data = (await response.json()) as {
      "post code": string;
      places?: Array<{ "place name": string; state: string }>;
    };
    return data["post code"]?.slice(0, 5) ?? null;
  } catch {
    return null;
  }
}
