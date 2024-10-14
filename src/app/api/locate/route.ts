import { NextRequest, NextResponse } from "next/server"
import { googleGeoCodeRequest } from "@/app/api/locate/googleGeoCodeRequest"

export async function GET(req: NextRequest) {
  try {
    const latitude = Number.parseFloat(
      req.nextUrl.searchParams.get("latitude")?.toString() ?? "",
    )
    const longitude = Number.parseFloat(
      req.nextUrl.searchParams.get("longitude")?.toString() ?? "",
    )
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
