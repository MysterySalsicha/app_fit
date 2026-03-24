import { Suspense } from 'react'
import { HunterProfile } from '@/components/hunter/HunterProfile'
import { DailyQuestCard } from '@/components/quests/DailyQuestCard'
import { WaterTracker } from '@/components/nutrition/WaterTracker'
import { MacroRing } from '@/components/nutrition/MacroRing'
import { XpEventFeed } from '@/components/hunter/XpEventFeed'
import { ShadowArmy } from '@/components/hunter/ShadowArmy'

export default function DashboardPage() {
  return (
    <div className="px-4 pt-4 pb-6 space-y-4 max-w-lg mx-auto">
      {/* Hunter Profile Card */}
      <Suspense fallback={<div className="hunter-card h-32 animate-pulse" />}>
        <HunterProfile />
      </Suspense>

      {/* Daily Quests */}
      <Suspense fallback={<div className="hunter-card h-24 animate-pulse" />}>
        <DailyQuestCard />
      </Suspense>

      {/* Água + Macros */}
      <div className="grid grid-cols-2 gap-3">
        <Suspense fallback={<div className="hunter-card h-28 animate-pulse" />}>
          <WaterTracker compact />
        </Suspense>
        <Suspense fallback={<div className="hunter-card h-28 animate-pulse" />}>
          <MacroRing compact />
        </Suspense>
      </div>

      {/* Shadow Army */}
      <Suspense fallback={<div className="hunter-card h-20 animate-pulse" />}>
        <ShadowArmy />
      </Suspense>

      {/* Feed de XP */}
      <Suspense fallback={null}>
        <XpEventFeed />
      </Suspense>
    </div>
  )
}
