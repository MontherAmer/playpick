import type { JSX } from 'react'

import type { IPreviewVideo } from '@/models/landing.interface'

interface IMiniVideoProps {
  video: IPreviewVideo
}

export function MiniVideo({ video }: IMiniVideoProps): JSX.Element {
  return (
    <div className="mb-2 flex items-center gap-2 rounded-md border border-border bg-background p-2">
      <img
        src={video.image}
        alt=""
        width={72}
        height={42}
        className="h-10 w-[70px] rounded object-cover"
      />
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold">{video.title}</p>
        <p className="text-[10px] text-muted-foreground">{video.channel}</p>
      </div>
    </div>
  )
}
