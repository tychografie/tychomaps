/* eslint-disable @next/next/no-img-element */
import { memo, ReactNode } from "react"
import { Dialog, DialogContent, DialogTrigger } from "./Dialog"

interface PremiumDialogProps {
  children: ReactNode
}

export const PremiumDialog = memo<PremiumDialogProps>((props) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent>
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-2xl font-bold">
            Polomaps{" "}
            <span className="bg-gradient-to-r text-xl from-yellow-400 to-orange-500 text-transparent bg-clip-text">
              PREMIUM
            </span>
          </h2>
        </div>
        <div>
          <p className="text-sm line-through text-gray-500">€66,99 / YEAR</p>
          <p className="text-2xl font-bold text-green-700">€24,95 / year</p>
          <p className="text-sm text-purple">
            Impress your friends, impress yourself. Stop buying mediocre guides
            or doomscrolling TripAdvisor, start <b>discovering hidden gems</b>.
          </p>
          <div className="bg-[#FAEDD1] text-purple p-4 mt-2 rounded-md text-center">
            <img
              src="/img/discover.png"
              alt="Discover"
              className="w-14 h-14 mx-auto mb-2"
            />
            <h2>(Re)discover the world</h2>
            <p>
              Don&apos;t they say that life&apos;s about collecting memories?
            </p>
          </div>
          <div className="mt-2 space-y-2">
            <div className="bg-[#FAEDD1] text-purple p-3 rounded-md flex items-center">
              <p className="w-8 h-8 rounded-md flex items-center justify-center">
                💎
              </p>
              <p className="ml-2">
                <span className="font-medium">No more hidden results</span> –
                See up to 20 results
              </p>
            </div>
            <div className="bg-[#FAEDD1] text-purple p-3 rounded-md flex items-center">
              <p className="w-8 h-8 rounded-md flex items-center justify-center">
                📱
              </p>
              <p className="ml-2">
                <span className="font-medium">Polomaps iOS app</span> - become a
                betatester
              </p>
            </div>
            <div className="bg-[#FAEDD1] text-purple p-3 rounded-md flex items-center">
              <p className="w-8 h-8 rounded-md flex items-center justify-center">
                🪩
              </p>
              <p className="ml-2">
                <span className="font-medium">No advertisements</span> - That
                one speaks for itself
              </p>
            </div>
          </div>
        </div>
        <div className="border-t mt-3 border-gray-200 sm:border-t-0">
          <button
            id="premiumButton"
            className="bg-gradient-to-r from-[#EEB053] via-[#F5C87A] to-[#EEB053] text-black text-opacity-90 rounded-md px-6 py-4 w-full relative overflow-hidden transition-transform duration-300 ease-in-out hover:scale-[1.02]"
          >
            <span className="relative z-10">Start free week</span>
            <div className="shine-effect" />
          </button>
          <p className="mt-2 text-sm">First week free, then €24,95 / year</p>
        </div>
      </DialogContent>
    </Dialog>
  )
})

PremiumDialog.displayName = "PremiumDialog"
