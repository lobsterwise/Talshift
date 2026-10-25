import { Star } from 'lucide-react'

const starPositions = [
  { left: '50%', top: '13%' },
  { left: '85.2%', top: '38.6%' },
  { left: '71.8%', top: '80%' },
  { left: '28.2%', top: '80%' },
  { left: '14.8%', top: '38.6%' },
]

// `animated` spins the stars into place once when the indicator first appears.
export default function StarRatingIndicator({
  rating,
  compact = false,
  animated = false,
}: {
  rating: number
  compact?: boolean
  animated?: boolean
}) {
  const boundedRating = Math.max(0, Math.min(5, rating))
  const visibleStars = Math.round(boundedRating)
  const score = Number.isInteger(rating) ? String(rating) : rating.toFixed(1)
  const [wholeScore, decimalScore] = score.split('.')

  return (
    <span
      role="img"
      aria-label={`${score} out of 5 stars`}
      className={`relative grid shrink-0 place-items-center ${compact ? 'size-10' : 'size-14'}`}
    >
      <span aria-hidden="true" className={`absolute inset-0 ${animated ? 'animate-rating-spin' : ''}`}>
        {starPositions.map((position, index) => {
          const filled = index < visibleStars
          return (
            <Star
              key={position.left}
              fill={filled ? 'currentColor' : 'none'}
              strokeWidth={2}
              className={`absolute -translate-x-1/2 -translate-y-1/2 ${compact ? 'size-2.5' : 'size-3.5'} ${filled ? 'text-amber-500' : 'text-gray-300'} ${animated ? 'animate-rating-star-in' : ''}`}
              style={position}
            />
          )
        })}
      </span>
      <span className={`z-10 font-semibold tabular-nums text-gray-900 ${compact ? 'text-xs' : 'text-base'} ${animated ? 'animate-rating-score-in' : ''}`}>
        {wholeScore}
        {decimalScore !== undefined && <span className="text-[0.8em]">.{decimalScore}</span>}
      </span>
    </span>
  )
}