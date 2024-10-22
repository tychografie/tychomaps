import { mapRequests } from "@/app/server-actions"
import { MapRequestCounts } from "@/app/types"
import { cx } from "class-variance-authority"
import { memo, useCallback, useEffect, useState } from "react"

export const Stats = memo(() => {
  const [stats, setStats] = useState<MapRequestCounts>()
  const getStats = useCallback(async () => {
    try {
      const res = await mapRequests()
      setStats(res)
    } catch (err) {
      console.error(err)
    }
  }, [])
  useEffect(() => {
    // Load the stats on mount
    getStats()
  }, [getStats])
  return (
    <p
      className={cx(
        "text-sm text-purple",
        stats ? "animation-delayed" : "opacity-0",
      )}
    >
      🧢 We helped {stats?.totalUsers} people find {stats?.totalMapsRequests}{" "}
      local places
    </p>
  )
})

Stats.displayName = "Stats"
