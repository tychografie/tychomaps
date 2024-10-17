"use client"
import { LocationWithAddress, SearchObject } from "@/app/types"
import { HeroBox } from "@/lib/components/HeroBox"
import { ChangeEvent, useCallback, useState } from "react"
import { getUserLocation } from "@/lib/utils/getUserLocation"
import { ResultsBox } from "@/lib/components/ResultsBox"
import { searchAction } from "@/app/action"
import { FeedbackDialog } from "@/lib/components/FeedbackDialog"

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

  const search = useCallback(async (query: string) => {
    setApiLoading(true)
    try {
      const res = await searchAction({ query }) // TODO:  add more params, conforming SearchBody

      setResponse(res.response) // typesafe
      setApiLoading(false)
    } catch (error) {
      console.error((error as { message?: string }).message)
      window.alert(
        (error as { message?: string }).message || "An error occurred",
      )
      setResponse(undefined)
      setApiLoading(false)
    }
  }, [])

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

  const handleFeedbackSubmit = useCallback(async (feedbackText: string) => {
    try {
      const data = { feedbackText }
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

  const handlePositiveFeedback = useCallback(() => {
    handleRatingSubmit("1")
  }, [handleRatingSubmit])

  return (
    <div className="h-[70vh] flex flex-col items-center gap-4">
      <HeroBox
        address={location?.address}
        radius={radius}
        onPinClick={handlePinClick}
        setRadius={setRadius}
        onSearch={search}
        onClearLocation={clearLocation}
        searchIsLoading={apiLoading}
        locationLoading={locationLoading}
      />
      {response ? (
        <ResultsBox
          places={response.places}
          setIsFeedbackOpen={setIsFeedbackOpen}
          onPositiveFeedback={handlePositiveFeedback}
        />
      ) : (
        <p className="text-sm text-purple">
          🧢 We helped 405 people find 21199 local places
        </p>
      )}
      <FeedbackDialog
        open={isFeedbackOpen}
        setOpen={setIsFeedbackOpen}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  )
}
