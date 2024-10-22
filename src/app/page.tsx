/* eslint-disable @next/next/no-img-element */
"use client"

import { LocationWithAddress, SearchObject } from "@/app/types"
import { HeroBox } from "@/lib/components/HeroBox"
import { ChangeEvent, useCallback, useState } from "react"
import { getUserLocation } from "@/lib/utils/getUserLocation"
import { ResultsBox } from "@/lib/components/ResultsBox"
import { searchAction } from "@/app/server-actions"
import { FeedbackDialog } from "@/lib/components/FeedbackDialog"
import { Stats } from "@/lib/components/Stats"
import { useRouter } from "next/navigation"
import { Discovery } from "@/lib/components/Discovery"
import { RecentSearches } from "@/lib/components/RecentSearches"

export default function Home() {
  const [apiLoading, setApiLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)

  const [location, setLocation] = useState<LocationWithAddress>()
  const [radius, _setRadius] = useState("500m")
  const [response, setResponse] = useState<SearchObject>()
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)

  const handlePinClick = useCallback(async () => {
    setLocationLoading(true)
    const location = await getUserLocation()
    if (location.success) {
      setLocation(location as LocationWithAddress)
    } else {
      console.error(location.errorMessage)
      window.alert(location.errorMessage)
    }
    setLocationLoading(false)
  }, [])

  const setRadius = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    _setRadius(e.target.value)
  }, [])

  const clearLocation = useCallback(() => {
    setLocation(undefined)
  }, [])

  const router = useRouter()

  const search = useCallback(
    async (query: string) => {
      setApiLoading(true)
      try {
        const res = await searchAction({
          query,
          latitude: location?.latitude.toString() || "",
          longitude: location?.longitude.toString() || "",
          country: location?.country || "",
          radius: parseInt(radius),
        })
        setResponse(res.response)
        setApiLoading(false)
        router.push("/?q=" + query)
      } catch (error) {
        console.error((error as { message?: string }).message)
        window.alert(
          (error as { message?: string }).message || "An error occurred",
        )
        setResponse(undefined)
        setApiLoading(false)
      }
    },
    [
      location?.country,
      location?.latitude,
      location?.longitude,
      radius,
      router,
    ],
  )

  const handleRatingSubmit = useCallback(async (rating: "-1" | "1") => {
    try {
      const data = { rating }
      await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      console.log("Feedback submitted successfully:", data)
      alert("Thank you for your feedback!")
    } catch (error) {
      console.error("Error submitting feedback:", error)
      alert("Error submitting feedback. Please try again later.")
    }
  }, [])

  const handleFeedbackSubmit = useCallback(async (text: string) => {
    try {
      // TODO
      // const data = { rating }
      // await fetch("/api/feedback", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify(data),
      // })
      // console.log("Feedback submitted successfully:", data)
      // alert("Thank you for your feedback!")
      setIsFeedbackOpen(false)
    } catch (error) {
      console.error("Error submitting feedback:", error)
      alert("Error submitting feedback. Please try again later.")
    }
  }, [])

  const openFeedback = useCallback(() => {
    setIsFeedbackOpen(true)
  }, [])

  const handlePositiveFeedback = useCallback(() => {
    handleRatingSubmit("1")
  }, [handleRatingSubmit])

  const handleNegativeFeedback = useCallback(() => {
    handleRatingSubmit("-1")
  }, [handleRatingSubmit])

  return (
    <div>
      <div className="min-h-[70vh] flex flex-col justify-center items-center gap-4">
        <HeroBox
          address={location?.address}
          radius={radius}
          onPinClick={handlePinClick}
          setRadius={setRadius}
          onSearch={search}
          onClearLocation={clearLocation}
          searchLoading={apiLoading}
          locationLoading={locationLoading}
        />
        {response ? (
          <ResultsBox
            places={response.places}
            setIsFeedbackOpen={setIsFeedbackOpen}
            onPositiveFeedback={handlePositiveFeedback}
            onNegativeFeedback={handleNegativeFeedback}
          />
        ) : (
          <Stats />
        )}
      </div>
      <div className="flex flex-col gap-12 w-full max-w-6xl mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h2>Recent Discoveries</h2>
            <Discovery
              name="Petra's Sommerkafé"
              location="Langelille, Netherlands"
              text="Petra's Summer Café is a hidden gem with delicious homemade cakes, warm hospitality, and a charming terrace perfect for a cycling break or a cozy chat. A must-visit!"
              rating="4.9"
              image="/places/discovery1.jpg"
              href="https://maps.app.goo.gl/bikaH2h2G3qr8stw5"
            />
            <Discovery
              name="La Forge des Halles"
              location="Chambéry, France"
              text="Once an iron forge, now transformed into a lively market hub full of local crafts and artisanal delights in the heart of Chambéry."
              rating="4.9"
              image="/places/discovery2.webp"
              href="https://maps.app.goo.gl/EXGt26Ktu43mshBC8"
            />
            <Discovery
              name="Wangedikanda Peak"
              location="Kalupahana, Sri Lanka"
              text="Breathtaking views and a challenging hike, leading adventurers to the stunning summit of a lesser-known mountain gem."
              rating="4.9"
              image="/places/discovery3.jpg"
              href="https://maps.app.goo.gl/mqPJNn5m4SCNofuY9"
            />
            <Discovery
              name="Old Post office Cafe Gallery"
              location="Kincraig, Scotland"
              text="Art café that blends creativity and history, a cozy spot in a former village post office."
              rating="4.9"
              image="/places/discovery4.jpg"
              href="https://maps.app.goo.gl/cHjLLj9ttHmk7z1s8"
            />
          </div>
          <div>
            <h2>Recent Searches</h2>
            <RecentSearches />
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:h-60">
          <div className="md:hidden w-full h-48">
            <img
              src="./img/mockuuups-cwe2keXMS43kgu3GBxU5xt.jpeg"
              alt="App mockup"
              className="object-cover w-full h-full rounded-t-md"
            />
          </div>
          <div className="bg-[#313E6D] md:w-full text-white p-6 md:p-8 rounded-b-md md:rounded-l-md md:rounded-r-none flex-grow flex flex-col justify-center">
            <h2 className="text-xl md:text-2xl mb-2 font-medium text-white">
              Become an app tester
            </h2>
            <p className="text-md md:text-xl mb-4">
              Dear discoverees, we hear you. An iOS app is currently in testing
              phase.
            </p>
            <a
              href="mailto:tycho@polomaps.com?subject=iOS%20tester&amp;body=My%20apple%20ID%20is%3A"
              className="inline-block bg-[#EEB053] text-fuchsia-950 px-4 py-2 md:px-6 md:py-3 rounded-md hover:bg-opacity-90 transition-colors w-fit text-sm md:text-base"
            >
              Join Testflight
            </a>
          </div>
          <div className="hidden md:block md:w-full h-64 md:h-full">
            <img
              src="/img/mockuuups-cwe2keXMS43kgu3GBxU5xt.jpeg"
              alt="App mockup"
              className="object-cover w-full h-full rounded-r-md"
            />
          </div>
        </div>
      </div>
      <div className="footer mt-20 w-full bg-black/5 p-4 text-center text-sm text-gray-500">
        <button type="button" onClick={openFeedback}>
          💌 Feedback? Tell me in a minute!
        </button>
      </div>
      <FeedbackDialog
        open={isFeedbackOpen}
        setOpen={setIsFeedbackOpen}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  )
}
