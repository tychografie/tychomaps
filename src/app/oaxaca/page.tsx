'use client'

import React, { useCallback, useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { Building, Coffee, Plus, Search, Store, Utensils } from "lucide-react"
import { renderToStaticMarkup } from "react-dom/server"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { searchAction } from "@/app/action"

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
)
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
)
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false },
)
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false },
)
const Polygon = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polygon),
  { ssr: false },
)

const initialCategories = [
  {
    id: "musea",
    label: "Museums",
    toggleLabel: "Museums",
    icon: Building,
    description: "Explore the rich local culture",
    color: "#E2A74F",
    textColor: "#FFF1DD",
  },
  {
    id: "restaurant",
    label: "Restaurants",
    toggleLabel: "Restaurants",
    icon: Utensils,
    description: "Authentic Oaxacan flavors",
    color: "#759E82",
    textColor: "#EBFCE5",
  },
  {
    id: "design shops",
    label: "Design Shops",
    toggleLabel: "Shops",
    icon: Store,
    description: "Local design and crafts",
    color: "#D66F50",
    textColor: "#FFDEDE",
  },
  {
    id: "cafe",
    label: "Cafés",
    toggleLabel: "Cafés",
    icon: Coffee,
    description: "Cozy coffee shops",
    color: "#313E6D",
    textColor: "#E9E8FF",
  },
]

const neighborhoods = [
  { id: "jalatlaco", name: "Jalatlaco", color: "#FFA07A" },
  { id: "xochimilco", name: "Xochimilco", color: "#98FB98" },
  { id: "centro-historico", name: "Centro Histórico", color: "#87CEFA" },
]

export default function Component() {
  const [categories, setCategories] = useState(initialCategories)
  const [activeFilters, setActiveFilters] = useState([])
  const [activeNeighborhoods, setActiveNeighborhoods] = useState([])
  const [expandedCategories, setExpandedCategories] = useState({})
  const [hoveredPlace, setHoveredPlace] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [places, setPlaces] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [neighborhoodPolygons, setNeighborhoodPolygons] = useState({})
  const [neighborhoodPolygonsLoading, setNeighborhoodPolygonsLoading] =
    useState(true)
  const [debugLog, setDebugLog] = useState([])
  const [showSearchBox, setShowSearchBox] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  const isBrowser = typeof window !== 'undefined';

  const addDebugLog = useCallback((message) => {
    setDebugLog((prev) => [...prev, `${new Date().toISOString()}: ${message}`])
    console.log(message)
  }, [])

  useEffect(() => {
    addDebugLog("Component mounted, starting data fetch")
    fetch("/oaxaca.json")
      .then((response) => response.json())
      .then((data) => {
        addDebugLog(
          `Received data: ${JSON.stringify(data).substring(0, 100)}...`,
        )
        const processedPlaces = {}
        const uniquePlaces = new Set()
        data.forEach((item) => {
          if (!processedPlaces[item.query]) {
            processedPlaces[item.query] = []
          }
          item.data.places.forEach((place) => {
            const placeKey = `${place.displayName.text}-${place.location.latitude}-${place.location.longitude}`
            if (!uniquePlaces.has(placeKey)) {
              uniquePlaces.add(placeKey)
              processedPlaces[item.query].push({
                id: `${item.query}-${place.displayName.text}`,
                name: place.displayName.text,
                rating: place.rating,
                review: `${place.userRatingCount} reviews`,
                reviewer: "Google",
                lat: place.location.latitude,
                lng: place.location.longitude,
                url: place.googleMapsUri,
                neighborhood: item.location,
              })
            }
          })
        })
        setPlaces(processedPlaces)
        setActiveFilters(Object.keys(processedPlaces))
        setActiveNeighborhoods(neighborhoods.map((n) => n.id))
        setLoading(false)
        addDebugLog("Processed places data and updated state")
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
        addDebugLog(`Error fetching places data: ${err.message}`)
      })

    const fetchNeighborhoodPolygons = async () => {
      setNeighborhoodPolygonsLoading(true)
      addDebugLog("Starting to fetch neighborhood polygons")
      const polygons = {}
      for (const neighborhood of neighborhoods) {
        try {
          addDebugLog(`Fetching polygon for ${neighborhood.name}`)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
              neighborhood.name + ", Oaxaca de Juárez, Mexico",
            )}&format=json&polygon_geojson=1&limit=1`,
          )
          const data = await response.json()
          addDebugLog(
            `Received data for ${neighborhood.name}: ${JSON.stringify(data)}`,
          )
          if (data.length > 0 && data[0].geojson) {
            let coordinates = []
            if (data[0].geojson.type === "Polygon") {
              coordinates = [data[0].geojson.coordinates[0]]
            } else if (data[0].geojson.type === "MultiPolygon") {
              coordinates = data[0].geojson.coordinates[0]
            }
            coordinates = coordinates.map((poly) =>
              poly.map((coord) => [coord[1], coord[0]]),
            )
            polygons[neighborhood.id] = coordinates
            addDebugLog(
              `Processed coordinates for ${neighborhood.name}: ${JSON.stringify(
                coordinates,
              )}`,
            )
          } else {
            addDebugLog(`No polygon data found for ${neighborhood.name}`)
          }
        } catch (error) {
          addDebugLog(
            `Error fetching polygon for ${neighborhood.name}: ${error.message}`,
          )
        }
      }
      setNeighborhoodPolygons(polygons)
      addDebugLog(`Final polygons object: ${JSON.stringify(polygons)}`)
      setNeighborhoodPolygonsLoading(false)
    }

    fetchNeighborhoodPolygons()
  }, [addDebugLog])

  const filteredPlaces = useMemo(() => {
    const filtered = {}
    Object.entries(places).forEach(([category, categoryPlaces]) => {
      if (activeFilters.includes(category)) {
        filtered[category] = categoryPlaces
      }
    })
    return filtered
  }, [places, activeFilters, activeNeighborhoods])

  console.log("filtered places", filteredPlaces)

  const toggleFilter = useCallback((categoryId) => {
    setActiveFilters((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    )
  }, [])

  const toggleNeighborhood = useCallback((neighborhoodId) => {
    setActiveNeighborhoods((prev) =>
      prev.includes(neighborhoodId)
        ? prev.filter((id) => id !== neighborhoodId)
        : [...prev, neighborhoodId],
    )
  }, [])

  const toggleExpand = useCallback((categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }, [])

  const handleCustomSearch = useCallback(async (e) => {
    e.preventDefault();
    const query = `${searchTerm} in Oaxaca`;
    addDebugLog(`Performing custom search: ${query}`);
    setSearchLoading(true);

    try {
      const responseData = await searchAction({ query });
      console.log(responseData)
      addDebugLog(`Raw response data: ${JSON.stringify(responseData)}`);

      if (!responseData || !responseData.response) {
        throw new Error('Invalid response format');
      }

      const data = responseData.response;
      addDebugLog(`Processed response data: ${JSON.stringify(data)}`);

      const newCategoryId = `custom-${Date.now()}`;
      const newCategory = {
        id: newCategoryId,
        label: data.aiResponse?.aiType || "Custom Search",
        toggleLabel: data.aiResponse?.aiType || "Custom",
        icon: data.aiResponse?.aiEmoji || "🔍",
        description: `Custom search results for "${searchTerm}"`,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        textColor: "#FFFFFF",
      };

      addDebugLog(`New category: ${JSON.stringify(newCategory)}`);

      console.log("places", data.places)

      const newPlaces = Array.isArray(data.places) ? data.places.map((place) => ({
        id: `${newCategoryId}-${place.name || place.displayName?.text}`,
        name: place.name || place.displayName?.text,
        rating: place.rating,
        review: `${place.userRatingCount} reviews`,
        reviewer: "Google",
        lat: place.location?.latitude || place.lat,
        lng: place.location?.longitude || place.lng,
        url: place.googleMapsUri || place.url,
        neighborhood: "custom",
      })) : [];

      console.log("new places", newPlaces)

      setCategories((prev) => [...prev, newCategory]);
      setPlaces((prev) => ({ ...prev, [newCategoryId]: newPlaces }));
      setActiveFilters((prev) => [...prev, newCategoryId]);
      addDebugLog(`Added new category and ${newPlaces.length} places for custom search`);
    } catch (error) {
      setError(error.message);
      addDebugLog(`Error in custom search: ${error.message}`);
    } finally {
      setSearchLoading(false);
    }
  }, [searchTerm, addDebugLog, searchAction]);

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="relative min-h-min w-full">
      <style jsx global>{`
        @font-face {
          font-family: "Moranga";
          src: url("https://s3.amazonaws.com/webflow-prod-assets/64f079f8c0cbc83545a1c2e1/670983799c34f243d2b34f55_MorangaRegular.woff")
            format("woff");
          font-weight: normal;
          font-style: normal;
        }
        @font-face {
          font-family: "Moranga";
          src: url("https://s3.amazonaws.com/webflow-prod-assets/64f079f8c0cbc83545a1c2e1/67098379b1955ea664e70dd0_MorangeMedium.woff")
            format("woff");
          font-weight: 500;
          font-style: normal;
        }
        .leaflet-container {
          height: 100%;
          width: 100%;
        }
        @media (max-width: 768px) {
          .responsive-sidebar {
            width: 100% !important;
            height: auto !important;
            overflow-y: visible;
            position: relative !important;
            background: rgba(255, 251, 245, 0.9) !important;
          }
          .responsive-content {
            padding: 1rem !important;
          }
          .responsive-grid {
            grid-template-columns: 1fr !important;
          }
          .mobile-map {
            height: 50vh !important;
          }
        }
      `}</style>

      <div className="md:hidden px-4 py-6 bg-[#FFFBF5]">
        <p className="text-sm text-gray-600">OCTOBER 2024</p>
        <h1 className="text-4xl font-['Moranga'] text-[#1f2937] mt-2">
          <span className="font-normal">Hidden gems in </span>
          <span className="font-bold">Oaxaca</span>
        </h1>
        <div className="flex items-center mt-4">
          <img
            src="/img/miguel.jpeg?height=40&width=40"
            alt="User"
            className="object-cover w-10 h-10 rounded-full mr-2"
          />
          <span className="text-sm text-gray-700">
            Miguel, José and Alejandro
          </span>
        </div>
      </div>

      <div className="mobile-map md:h-screen w-full">
        <MapContainer
          center={[17.0628849, -96.7509703]}
          zoom={14}
          style={{ height: "100%", width: "100%", backgroundColor: "#FFFBF5" }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {Object.entries(neighborhoodPolygons).map(
            ([neighborhoodId, polygons]) => 
              polygons.map((polygon, index) => {
                const neighborhood = neighborhoods.find(
                  (n) =>   n.id === neighborhoodId,
                )
                return (
                  <Polygon
                    
                    key={`${neighborhoodId}-${index}`}
                    positions={polygon}
                    pathOptions={{
                      fillColor: neighborhood.color,
                      fillOpacity: 0.2,
                      weight: 2,
                      color: neighborhood.color,
                    }}
                  >
                    <Popup>{neighborhood.name}</Popup>
                  </Polygon>
                )
              }),
          )}
          {Object.entries(filteredPlaces).flatMap(
            ([categoryId, categoryPlaces]) =>
              categoryPlaces.map((place) => {
                const category = categories.find((c) => c.id === categoryId)
                const Icon = category.icon
                const iconSvg =
                  typeof Icon === "string"
                    ? Icon
                    : renderToStaticMarkup(
                        <Icon className="w-8 h-8 text-white" />,
                      )
                return (
                  <Marker
                    key={place.id}
                    position={[place.lat, place.lng]}
                    icon={L.divIcon({
                      html: `
                      <div style="background-color: ${category.color}; color: white; width: 24px; padding: 4px; height: 24px; display: flex; 
                      justify-content: center; align-items: center; border-radius: 50%;">
                        ${iconSvg}
                      </div>
                    `,
                      className: "custom-icon",
                      iconSize: [30, 30],
                      iconAnchor: [15, 0],
                    })}
                  >
                    <Popup>
                      <div style={{ color: category.color }}>
                        <a
                          href={place.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold hover:underline"
                        >
                          {place.name}
                        </a>
                        <div className="flex items-center mt-1">
                          <span className="text-yellow-500">
                            ★ {place.rating}
                          </span>
                          <span className="ml-2 text-xs">{place.review}</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              }),
          )}
        </MapContainer>
      </div>

      <div
        className="absolute top-0 left-0 w-1/2 h-full overflow-y-auto sm:p-0 md:p-20 responsive-sidebar"
        style={{
          background:
            "linear-gradient(90deg, rgba(255, 251, 245, 0.9) 0%, rgba(255, 251, 245, 0.8) 80%, rgba(255, 251, 245, 0) 100%)",
          zIndex: 1000,
        }}
      >
        <div className="max-w-lg responsive-content">
          <div className="mb-6 hidden md:block">
            <p className="text-sm text-gray-600">OCTOBER 2024</p>
            <h1 className="text-4xl md:text-6xl font-['Moranga'] text-[#1f2937]">
              <span className="font-normal">Hidden gems in </span>
              <span className="font-bold">Oaxaca</span>
            </h1>
            <div className="flex items-center mt-2">
              <img
                src="/img/miguel.jpeg?height=40&width=40"
                alt="User"
                className="object-cover w-10 h-10 rounded-full mr-2"
              />
              <span className="text-sm text-gray-700">
                Miguel, José and Alejandro
              </span>
            </div>
          </div>

          <p className="mb-6 text-sm text-[#1f2937]">
            ¡Bienvenidos a Oaxaca, amigos! We're about to take you on a journey
            through the soul of our beloved city. Forget the tourist traps -
            we're talking about the real Oaxaca, where the magic happens in
            hidden corners and local hangouts.
          </p>

          <div className="flex flex-wrap mb-6">
            {showSearchBox && (
              <form onSubmit={handleCustomSearch} className="flex w-full mb-4">
                <div className="relative flex-grow mr-2">
                  <input
                    type="text"
                    placeholder="Search places"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md"
                    disabled={searchLoading}
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md"
                  disabled={searchLoading}
                >
                  {searchLoading ? 'Searching...' : 'Search'}
                </button>
              </form>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`px-3 py-1 text-sm font-medium rounded-md border ${
                  activeFilters.includes(category.id)
                    ? "bg-[#1f2937] text-white border-[#1f2937]"
                    : "bg-white text-[#1f2937] border-[#1f2937]"
                }`}
                onClick={() => toggleFilter(category.id)}
              >
                {category.toggleLabel}
              </button>
            ))}
            <button
              className="px-3 py-1 text-sm font-medium rounded-md border bg-white text-[#1f2937] border-[#1f2937]"
              onClick={() => setShowSearchBox(!showSearchBox)}
            >
              + Custom
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 responsive-grid">
            {categories
              .filter((category) => activeFilters.includes(category.id))
              .map((category) => (
                <div
                  key={category.id}
                  className="rounded-lg overflow-hidden shadow"
                  style={{ backgroundColor: category.color }}
                >
                  <div className="p-4">
                    <div className="flex items-center mb-2">
                      {typeof category.icon === "string" ? (
                        <span className="text-2xl mr-2">{category.icon}</span>
                      ) : (
                        <category.icon className="w-8 h-8 text-white mr-2" />
                      )}
                      <h2 className="text-lg font-['Moranga'] font-medium text-white">
                        {filteredPlaces[category.id]?.length || 0}{" "}
                        {category.label}
                      </h2>
                    </div>
                    <p
                      className="text-xs mb-4"
                      style={{ color: category.textColor }}
                    >
                      {category.description}
                    </p>
                    <div className="space-y-2">
                      {filteredPlaces[category.id] &&
                        filteredPlaces[category.id]
                          .slice(
                            0,
                            expandedCategories[category.id] ? undefined : 4,
                          )
                          .map((place) => (
                            <a
                              key={place.id}
                              href={place.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`block bg-white bg-opacity-10 rounded p-2 transition-all duration-200 ${
                                hoveredPlace === `${category.id}-${place.id}`
                                  ? "transform scale-105"
                                  : ""
                              }`}
                              onMouseEnter={() =>
                                setHoveredPlace(`${category.id}-${place.id}`)
                              }
                              onMouseLeave={() => setHoveredPlace(null)}
                              style={{ color: category.textColor }}
                            >
                              <h3 className="text-sm font-semibold">
                                {place.name}
                              </h3>
                              <div className="flex items-center mt-1">
                                <span className="text-yellow-300 text-xs">
                                  ★ {place.rating}
                                </span>
                                <span className="ml-2 text-xs">
                                  {place.review}
                                </span>
                              </div>
                            </a>
                          ))}
                    </div>
                    {filteredPlaces[category.id] &&
                      filteredPlaces[category.id].length > 4 && (
                        <button
                          onClick={() => toggleExpand(category.id)}
                          className="text-xs hover:underline mt-2"
                          style={{ color: category.textColor }}
                        >
                          {expandedCategories[category.id]
                            ? "Show less"
                            : `Show ${
                                filteredPlaces[category.id].length - 4
                              } more`}
                        </button>
                      )}
                  </div>
                </div>
              ))}
            {/* New "Add custom" block */}
            <div
              className="rounded-lg overflow-hidden shadow bg-gray-800 text-white cursor-pointer transition-all duration-200 hover:bg-gray-700"
              onClick={() => setShowSearchBox(!showSearchBox)}
            >
              <div className="p-4 h-full flex flex-col items-center justify-center">
                <Plus className="w-12 h-12 mb-4" />
                <h2 className="text-lg font-['Moranga'] font-medium mb-2">Add custom</h2>
                <p className="text-xs text-center">Market, Hikes, Nature, Breakfast</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Log Display */}
      <div className="absolute bottom-0 left-0 w-full bg-white bg-opacity-75 p-4 max-h-60 overflow-y-auto">
        <h3 className="font-bold mb-2">Debug Log:</h3>
        {debugLog.map((log, index) => (
          <p key={index} className="text-xs">
            {log}
          </p>
        ))}
      </div>
    </div>
  )
}