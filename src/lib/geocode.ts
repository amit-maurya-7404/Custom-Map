import { DestinationGeocode } from '@/types/location';

export async function searchGlobalGeocode(query: string): Promise<DestinationGeocode[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&q=${encodeURIComponent(
      query.trim()
    )}`;

    const response = await fetch(nominatimUrl, {
      headers: {
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    return data.map((item: any) => {
      const bbox = item.boundingbox
        ? [
            parseFloat(item.boundingbox[0]),
            parseFloat(item.boundingbox[1]),
            parseFloat(item.boundingbox[2]),
            parseFloat(item.boundingbox[3]),
          ] as [number, number, number, number]
        : undefined;

      const address = item.address || {};
      const city =
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.county ||
        item.name;
      const region = address.state || address.region || address.province || '';
      const country = address.country || '';

      return {
        name: item.name || city,
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        bbox,
        city,
        region,
        country,
      };
    });
  } catch (err) {
    console.error('Client geocode error:', err);
    return [];
  }
}
