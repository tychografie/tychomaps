import { ErrorResponse, Location, SuccessResponse } from "@/lib/types"

import { googleGeoCodeRequest } from "@/app/api/locate/googleGeoCodeRequest"

export async function getUserLocation(): Promise<
  SuccessResponse<Location> | ErrorResponse
> {
  if (window.navigator.geolocation) {
    try {
      const position: GeolocationPosition = await new Promise(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject)
        },
      )
      const { latitude, longitude } = position.coords

      return {
        success: true,
        ...(await googleGeoCodeRequest(latitude, longitude)),
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
      errorMessage: "Geolocation is not supported by this browser.",
    }
  }
}
