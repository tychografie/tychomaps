"use client"
import { useFormState, useFormStatus } from "react-dom"
import { search } from "@/app/action"
import { SearchStateResponse } from "@/app/types"

const initialState: SearchStateResponse = {
  message: "",
}
export default function Home() {
  const [state, formAction, isPending] = useFormState<SearchStateResponse>(
    search,
    initialState,
  )
  const { pending } = useFormStatus()

  return (
    <div className={"flex items-center justify-center min-h-screen"}>
      <div className={"w-xl bg-amber-50 p-4"}>
        {pending}
        <h1 className={"p-12 text-center text-4xl"}>polomaps</h1>
        {state ? state.message : "nostate"}
        {isPending}
        <form
          onSubmit={(e) => (isPending ? e.preventDefault() : null)}
          action={formAction}
        >
          <input
            disabled={isPending}
            type="text"
            name={"query"}
            placeholder={"nice place"}
          />
          <button disabled={isPending} type={"submit"}>
            Search Lokal
          </button>
          {isPending ? "Loading" : ""}
        </form>
      </div>
    </div>
  )
}
