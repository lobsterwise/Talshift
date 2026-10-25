import { useState, type MouseEvent } from 'react'
import { Star } from 'lucide-react'

const starCount = 5
const halfStepValues = Array.from({ length: starCount * 2 }, (_, index) => (index + 1) / 2)

function formatStars(value: number) {
  return `${value} ${value === 1 ? 'star' : 'stars'}`
}

// Half-star picker. Hovering previews the value in faded yellow; clicking fills it solid.
// Hidden radios keep it keyboard and screen-reader accessible (arrow keys step by half a star).
export default function StarRatingInput({
  name,
  value,
  onChange,
  required = false,
}: {
  name: string
  value: number
  onChange: (value: number) => void
  required?: boolean
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const shown = hovered ?? value
  const previewing = hovered !== null && hovered !== value

  function valueAt(event: MouseEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    const position = (event.clientX - bounds.left) / bounds.width
    const halfSteps = Math.ceil(position * starCount * 2)
    return Math.min(starCount, Math.max(1, halfSteps) / 2)
  }

  return (
    <div className="inline-flex rounded-md has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-blue-700">
      {halfStepValues.map((option) => (
        <input
          key={option}
          type="radio"
          name={name}
          value={option}
          checked={value === option}
          required={required && option === halfStepValues[0]}
          onChange={() => onChange(option)}
          aria-label={formatStars(option)}
          className="sr-only"
        />
      ))}
      <div
        aria-hidden="true"
        className="flex cursor-pointer gap-1"
        onMouseMove={(event) => setHovered(valueAt(event))}
        onMouseLeave={() => setHovered(null)}
        onClick={(event) => onChange(valueAt(event))}
      >
        {Array.from({ length: starCount }, (_, index) => {
          const fill = Math.min(1, Math.max(0, shown - index))
          return (
            <span key={index} className="relative size-9">
              <Star className="absolute inset-0 size-9 text-gray-300" strokeWidth={1.5} />
              {fill > 0 && (
                <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                  <Star
                    className={`size-9 max-w-none text-amber-400 ${previewing ? 'opacity-50' : ''}`}
                    fill="currentColor"
                    strokeWidth={1.5}
                  />
                </span>
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}
