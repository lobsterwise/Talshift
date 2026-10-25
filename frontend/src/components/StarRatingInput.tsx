import { useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { Star } from 'lucide-react'

const starCount = 5
const halfStepValues = Array.from({ length: starCount * 2 }, (_, index) => (index + 1) / 2)
const burstDuration = 700

interface Burst {
  id: number
  x: number
  y: number
  particles: { half: boolean; style: CSSProperties }[]
}

// One particle per whole star chosen, plus a half star for a .5 rating, spread evenly around the cursor.
function makeParticles(value: number) {
  const whole = Math.floor(value)
  const total = whole + (value % 1 ? 1 : 0)
  const offset = Math.random() * Math.PI * 2
  return Array.from({ length: total }, (_, index) => {
    const angle = offset + (index / total) * Math.PI * 2 + (Math.random() - 0.5) * 0.4
    const distance = 34 + Math.random() * 18
    return {
      half: index >= whole,
      style: {
        '--dx': `${Math.cos(angle) * distance}px`,
        '--dy': `${Math.sin(angle) * distance}px`,
        '--spin': `${(Math.random() - 0.5) * 160}deg`,
      } as CSSProperties,
    }
  })
}

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
  const [bursts, setBursts] = useState<Burst[]>([])
  const nextBurstId = useRef(0)

  function select(event: MouseEvent<HTMLDivElement>) {
    const picked = valueAt(event)
    const bounds = event.currentTarget.getBoundingClientRect()
    const burst = {
      id: nextBurstId.current++,
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      particles: makeParticles(picked),
    }
    setBursts((current) => [...current, burst])
    window.setTimeout(() => setBursts((current) => current.filter((item) => item.id !== burst.id)), burstDuration)
    onChange(picked)
  }

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
        className="relative flex cursor-pointer gap-1"
        onMouseMove={(event) => setHovered(valueAt(event))}
        onMouseLeave={() => setHovered(null)}
        onClick={select}
      >
        {bursts.map((burst) =>
          burst.particles.map((particle, index) => (
            <span
              key={`${burst.id}:${index}`}
              className="animate-star-burst pointer-events-none absolute z-10"
              style={{ left: burst.x, top: burst.y, ...particle.style }}
            >
              {particle.half ? (
                <span className="block w-2 overflow-hidden">
                  <Star className="size-4 max-w-none text-amber-400" fill="currentColor" strokeWidth={1.5} />
                </span>
              ) : (
                <Star className="size-4 text-amber-400" fill="currentColor" strokeWidth={1.5} />
              )}
            </span>
          )),
        )}
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
