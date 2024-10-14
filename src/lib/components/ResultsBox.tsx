import { PlaceDetail } from "@/app/types"
import { StarIcon } from "lucide-react"
import { memo, useCallback, useState } from "react"
import { Button } from "./Button"

interface ResultsBoxProps {
  places: PlaceDetail[]
  onPositiveFeedback: () => void
  setIsFeedbackOpen: (open: boolean) => void
}

export const ResultsBox = memo<ResultsBoxProps>(
  ({ setIsFeedbackOpen, onPositiveFeedback, ...props }) => {
    const [moreIndex, setMoreIndex] = useState(0)
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
    const showMore = useCallback(() => {
      setMoreIndex((prev) => prev + 1)
    }, [])
    const resultsShown = (moreIndex + 1) * 5
    const moreResultsAvailable = props.places.length - resultsShown

    const handlePositiveFeedback = useCallback(() => {
      onPositiveFeedback()
      setFeedbackSubmitted(true)
    }, [onPositiveFeedback])

    const handleNegativeFeedback = useCallback(() => {
      setIsFeedbackOpen(true)
      setFeedbackSubmitted(true)
    }, [setIsFeedbackOpen])

    return (
      <div className="bg-orange-light w-full max-w-2xl flex flex-col text-purple p-6 rounded-lg">
        <h1>Locals love to go to...</h1>
        <div className="mt-4 flex flex-col space-y-2">
          {props.places.slice(0, resultsShown).map((p, i) => {
            //@ts-expect-error weird API response
            const place = p[i] ? p[i] : p // TODO: Fix API response
            return (
              <a
                key={place.id}
                href={place.googleMapsUri}
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-between rounded bg-gray-900 hover:bg-gray-950 text-lg p-4 text-white items-center gap-2"
              >
                <span>{place.name}</span>
                <span className="inline-flex gap-2 items-center">
                  <StarIcon className="size-4 fill-white" />
                  {place.rating}
                </span>
              </a>
            )
          })}
          {moreResultsAvailable > 0 && (
            <Button size="lg" onClick={showMore}>
              Load {Math.min(moreResultsAvailable, 5)} more result
              {moreResultsAvailable > 1 ? "s" : ""}
            </Button>
          )}
        </div>
        {feedbackSubmitted ? (
          <p className="mt-4">Thank you for your feedback!</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Button
              variant="clear"
              size="lg"
              onClick={handlePositiveFeedback}
              className="bg-orange-washed hover:bg-green-500 hover:text-white"
            >
              😎 Good results!
            </Button>
            <Button
              variant="clear"
              size="lg"
              onClick={handleNegativeFeedback}
              className="bg-orange-washed hover:bg-red-500 hover:text-white"
            >
              💔 Bad results!
            </Button>
          </div>
        )}
      </div>
    )
  },
)

ResultsBox.displayName = "ResultsBox"
