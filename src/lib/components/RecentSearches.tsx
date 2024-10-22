import { recentSearches } from "@/app/server-actions"
import { QueryInfo } from "@/app/types"
import { memo, useCallback, useEffect, useState } from "react"

export const RecentSearches = memo(() => {
  const [searches, setSearches] = useState<QueryInfo[]>()
  const getRecentSearches = useCallback(async () => {
    try {
      const res = await recentSearches()
      setSearches(res)
    } catch (err) {
      console.error(err)
    }
  }, [])
  useEffect(() => {
    // Load the stats on mount
    getRecentSearches()
  }, [getRecentSearches])
  return (
    <ul className="mt-4 gap-2 flex flex-col">
      {searches?.map((search, i) => (
        <li
          key={i}
          className="bg-white rounded-md p-4 transition-transform duration-300 ease-in-out hover:scale-[1.02] border border-gray-200 flex items-center cursor-pointer"
        >
          <span className="mr-2">{search.aiEmoji}</span>
          <span className="flex-grow">{search.originalQuery}</span>
          <span className="text-xs text-gray-500">{search.aiType}</span>
        </li>
      ))}
    </ul>
  )
})

RecentSearches.displayName = "RecentSearches"
