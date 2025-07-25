interface PlaceDetails {
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  placeId: string;
  formattedAddress: string;
}

interface PlacePrediction {
  placeId: string;
  description: string;
}

class GooglePlacesService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api';

  constructor() {
    // You'll need to add your Google Places API key to .env.local
    this.apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';
  }

  async getPlacePredictions(input: string): Promise<PlacePrediction[]> {
    if (!this.apiKey) {
      console.warn('Google Places API key not configured');
      return [];
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&key=${this.apiKey}`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        return data.predictions.map((prediction: any) => ({
          placeId: prediction.place_id,
          description: prediction.description,
        }));
      }
    } catch (error) {
      console.error('Error fetching place predictions:', error);
    }

    return [];
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    if (!this.apiKey) {
      console.warn('Google Places API key not configured');
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/place/details/json?place_id=${placeId}&fields=address_components,formatted_address,geometry&key=${this.apiKey}`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        const place = data.result;
        const addressComponents = place.address_components;

        return {
          address: this.extractAddressComponent(addressComponents, 'street_number') + ' ' + 
                   this.extractAddressComponent(addressComponents, 'route'),
          city: this.extractAddressComponent(addressComponents, 'locality'),
          state: this.extractAddressComponent(addressComponents, 'administrative_area_level_1'),
          zip: this.extractAddressComponent(addressComponents, 'postal_code'),
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          placeId: placeId,
          formattedAddress: place.formatted_address,
        };
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }

    return null;
  }

  private extractAddressComponent(components: any[], type: string): string {
    const component = components.find(comp => comp.types.includes(type));
    return component ? component.long_name : '';
  }

  async getStreetViewImage(latitude: number, longitude: number, width: number = 400, height: number = 300): Promise<string> {
    if (!this.apiKey) {
      return '';
    }

    return `${this.baseUrl}/streetview?size=${width}x${height}&location=${latitude},${longitude}&key=${this.apiKey}`;
  }
}

export const googlePlacesService = new GooglePlacesService();
export type { PlaceDetails, PlacePrediction };
