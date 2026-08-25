import { Play } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/utils/cn'

/**
 * Placeholder gradients, used when a playlist has no artwork.
 *
 * A playlist with no videos commonly has no thumbnail at all, so a whole
 * library can land here. Varying the gradient keeps such a library visually
 * distinguishable instead of a wall of identical grey boxes.
 */
const PLACEHOLDER_GRADIENTS: readonly string[] = [
  'from-rose-500 to-orange-400',
  'from-violet-500 to-indigo-400',
  'from-emerald-500 to-teal-400',
  'from-sky-500 to-cyan-400',
  'from-fuchsia-500 to-pink-400',
  'from-amber-500 to-yellow-400',
  'from-blue-500 to-violet-400',
  'from-teal-500 to-emerald-400',
]

/**
 * Picks a gradient from a seed string.
 *
 * Deterministic on purpose: the same playlist keeps the same placeholder across
 * renders, re-sorts, and page appends, so nothing shimmers when the list grows.
 */
function gradientFor(seed: string): string {
  let hash = 0

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0
  }

  return PLACEHOLDER_GRADIENTS[Math.abs(hash) % PLACEHOLDER_GRADIENTS.length]
}

interface PlaylistThumbnailProps {
  /** Absent for a playlist with no artwork; the placeholder is then the whole rendering. */
  src?: string
  /** Stable per playlist — the playlist id — so the placeholder never changes under the user. */
  seed: string
  className?: string
}

/**
 * A playlist's artwork in a fixed `aspect-video` box.
 *
 * The box is sized by its aspect ratio rather than by the image, so a missing,
 * slow, or broken thumbnail cannot collapse the card or shift the grid around
 * it. The gradient sits underneath at all times and simply shows through when
 * there is no image to cover it — which is also why a load failure needs no
 * layout work, only `setFailed`.
 *
 * Decorative: the playlist title is rendered as text beside it, so an `alt`
 * here would only repeat the title in the card's accessible name.
 */
export function PlaylistThumbnail({ src, seed, className }: PlaylistThumbnailProps) {
  const [failed, setFailed] = useState(false)

  const showImage = src !== undefined && !failed

  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative aspect-video w-full shrink-0 overflow-hidden bg-linear-to-br',
        gradientFor(seed),
        className,
      )}>
      {showImage && (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => {
            setFailed(true)
          }}
          className="h-full w-full object-cover"
        />
      )}

      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
        <Play className="h-5 w-5 fill-white text-white drop-shadow" />
      </span>
    </div>
  )
}
