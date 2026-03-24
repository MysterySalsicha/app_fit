import type { HunterRank } from '../stores/hunterStore'

export const RANK_ORDER: HunterRank[] = ['E', 'D', 'C', 'B', 'A', 'S', 'National']

export const RANK_COLORS: Record<HunterRank, string> = {
  E: '#9ca3af',
  D: '#22c55e',
  C: '#3b82f6',
  B: '#a855f7',
  A: '#f97316',
  S: '#eab308',
  National: '#ef4444',
}

export const RANK_GLOW_COLORS: Record<HunterRank, string> = {
  E: 'rgba(156,163,175,0.4)',
  D: 'rgba(34,197,94,0.4)',
  C: 'rgba(59,130,246,0.4)',
  B: 'rgba(168,85,247,0.4)',
  A: 'rgba(249,115,22,0.4)',
  S: 'rgba(234,179,8,0.5)',
  National: 'rgba(239,68,68,0.5)',
}

export const RANK_LABELS: Record<HunterRank, string> = {
  E: 'Rank E',
  D: 'Rank D',
  C: 'Rank C',
  B: 'Rank B',
  A: 'Rank A',
  S: 'Rank S',
  National: 'Hunter Nacional',
}

export function getRankColor(rank: HunterRank): string {
  return RANK_COLORS[rank] ?? '#9ca3af'
}

export function getRankGlow(rank: HunterRank): string {
  return RANK_GLOW_COLORS[rank] ?? 'rgba(156,163,175,0.3)'
}

export function getRankIndex(rank: HunterRank): number {
  return RANK_ORDER.indexOf(rank)
}

export function isHigherRank(a: HunterRank, b: HunterRank): boolean {
  return getRankIndex(a) > getRankIndex(b)
}
