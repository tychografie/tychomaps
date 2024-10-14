"use client"

/* eslint-disable @next/next/no-img-element */
import {
  ChangeEvent,
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react"
import { Button } from "./Button"

interface HeroBoxProps {
  children: ReactNode
}

const placeholderTexts = [
  "Jazzbar in Paris",
  "Arthouse cinema in Cairo",
  "Vega food in Paris-Nord",
  "Farm in Vermont",
  "Breakfast in Oaxaca",
  "Surf shop in Biarritz",
  "Camping near Milan",
  "Market in Lima",
  "Barber in Nijmegen",
  "Hidden beach in Cebu",
  "Ceramic studio in Seville",
  "Record shops crawl in",
  "Kayak Fjord in Oslo",
  "Cliff Picnic Kauai",
  "Hot spring in Hakone",
  "Shark Swim Bahamas",
  "Climbing gym in Tuscany",
  "Art studios in Florence",
  "Wineyard in Santiago",
  "Lagoon in Aruba",
  "Kebab in Ankara",
  "Dune Trek in Namib",
  "Tapas in Seville",
  "Taco Stand in LA",
  "Antiques in Sofia",
  "Hostel in Fès",
  "River kayaking in Banff",
  "Lunch in Alicante",
  "Speakeasy in Havana",
  "Artisan bakery in Valparaiso",
  "Scones in Devon",
  "Sake brewery in Nara",
]

export const HeroBox = memo<HeroBoxProps>(() => {
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [inputValue, setInputValue] = useState("")

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(
        (prev: number) => (prev + 1) % placeholderTexts.length,
      )
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const clearInputValue = useCallback(() => {
    setInputValue("")
  }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-orange-light flex flex-col text-purple p-6 rounded-lg">
        <h1>Where do the locals go?</h1>
        <p className="mt-1">
          Free from tourist traps, full of AI superpowers{" "}
          <span className="font-semibold">to find hidden gems</span> 🎷
        </p>
        <div className="relative mt-4">
          <input
            autoComplete="off"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholderTexts[placeholderIndex]}
            className="placeholder-gray-400 focus:placeholder-gray-200 focus:outline-0.5 focus:outline-gray-400 shadow-sm w-full pl-16 pr-10 py-4 rounded-md focus:outline-none focus:border-gray-400 text-lg"
          />
          <button
            className="absolute group -top-0.5 left-0.5 mt-5 ml-3 pr-2 border-r border-gray-300"
            title="Search nearby"
          >
            <img
              src="/img/location-off.svg"
              alt="Location"
              className="size-6 group-hover:hidden cursor-pointer"
            />
            <img
              src="/img/location-on.svg"
              alt="Location"
              className="size-6 hidden group-hover:block cursor-pointer"
            />
          </button>
          {inputValue && (
            <button
              onClick={clearInputValue}
              className="absolute top-0.5 right-0 mt-4 mr-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-400 hover:text-gray-600 cursor-pointer"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          )}
        </div>
        <Button size="lg" className="mt-3">
          Search
        </Button>
      </div>
      <p className="text-sm text-purple">
        🧢 We helped 405 people find 21199 local places
      </p>
    </div>
  )
})

HeroBox.displayName = "HeroBox"
