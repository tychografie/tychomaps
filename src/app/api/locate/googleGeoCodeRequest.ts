"use server"
export const googleGeoCodeRequest: (lat: number, lon: number) => Promise<{
  country: string;
  address: string;
  latitude: number;
  longitude: number
}> = async (lat: number, lon: number) => {
  const { results, status, error_message } = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${process.env.GOOGLE_MAPS_API_KEY}`
  ).then((res) => res.json())

  if (status !== "OK") {
    console.error("Error from Google Maps API:", status, error_message)
    throw new Error("Error from Google Maps API", {
      message: error_message
    })
  }

  let address = ""
  let country = ""

  if (results[0] && results[0].address_components) {
    const street = results[0].address_components.find((component) =>
      component.types.includes("route")
    )?.long_name
    const city = results[0].address_components.find((component) =>
      component.types.includes("locality")
    )?.long_name
    const countryComponent = results[0].address_components.find((component) =>
      component.types.includes("country")
    )

    address = `${street} in ${city}`
    country = countryComponent?.long_name
  }
  console.log(results)
  return {
    latitude: lat,
    longitude: lon,
    address,
    country
  }
}