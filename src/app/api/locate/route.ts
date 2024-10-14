import { NextRequest, NextResponse } from "next/server"

export const googleGeoCodeRequest: (lat: number, lon: number) => Promise<{
  country: string;
  address: string;
  latitude: number;
  longitude: number
}> = async (lat: number, lon: number) => {
  const { results, status, error_message } = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${process.env.GOOGLE_MAPS_API_KEY}`,
  ).then((res) => res.json())

  if (status !== "OK") {
    console.error("Error from Google Maps API:", status, error_message)
    throw new Error("Error from Google Maps API", {
      message: error_message,
    })
  }

  let address = ""
  let country = ""

  if (results[0] && results[0].address_components) {
    const street = results[0].address_components.find((component) =>
      component.types.includes("route"),
    )?.long_name
    const city = results[0].address_components.find((component) =>
      component.types.includes("locality"),
    )?.long_name
    const countryComponent = results[0].address_components.find((component) =>
      component.types.includes("country"),
    )

    address = `${street} in ${city}`
    country = countryComponent?.long_name
  }

  return {
    latitude: lat,
    longitude: lon,
    address,
    country,
  }
}

export async function GET(req: NextRequest) {
  try {
    const latitude = Number.parseFloat(req.nextUrl.searchParams.get("latitude")?.toString() ?? "")
    const longitude = Number.parseFloat(req.nextUrl.searchParams.get("longitude")?.toString() ?? "")
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: "Latitude and Longitude are required" },
        { status: 400 },
      )
    }

    const resp = await googleGeoCodeRequest(latitude, longitude)

    return NextResponse.json(resp, { status: 200 })
  } catch (error) {
    console.error("Error occurred while getting location:", error.message)
    return NextResponse.json(
      { error: "Failed to get location" },
      { status: 500 },
    )
  }
}
