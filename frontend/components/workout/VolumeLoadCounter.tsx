'use client'

import { useWorkoutStore } from '@/lib/stores/workoutStore'

export function VolumeLoadCounter() {
  const { totalVolumeLoad, prevSessionVolumeLoad } = useWorkoutStore()

  const delta = prevSessionVolumeLoad
    ? totalVolumeLoad - prevSessionVolumeLoad
    : null

  return (
    <div className="text-right">
      <p className="text-sm font-bold font-mono text-foreground">
        {totalVolumeLoad.toLocaleString('pt-BR')} kg
      </p>
      {delta !== null && (
        <p className={`text-xs font-mono ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {delta >= 0 ? '+' : ''}{delta.toFixed(0)} kg vs ant.
        </p>
      )}
    </div>
  )
}
