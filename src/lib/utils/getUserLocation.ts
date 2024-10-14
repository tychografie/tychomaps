import { Location, ErrorResponse, SuccessResponse } from "@/lib/types";

export async function getUserLocation(): Promise<SuccessResponse<Location> | ErrorResponse> {
  if (window.navigator.geolocation) {
    try {
      const position: GeolocationPosition = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      const { latitude, longitude } = position.coords;
      const response = await fetch(`/api/locate?latitude=${latitude}&longitude=${longitude}`);
      const data = await response.json();
      const { address, country } = data;
      return {
        success: true,
        latitude,
        longitude,
        address,
        country,
      }
    } catch (error) {
      return {
        success: false,
        errorMessage: (error as { message?: string }).message,
      }
    }
  } else {
    return {
      success: false,
      errorMessage: 'Geolocation is not supported by this browser.',
    }
  }
}