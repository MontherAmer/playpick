import type { JSX } from 'react'

import { ArrowRight, Copy, ShieldCheck, Sparkles } from 'lucide-react'

import { MiniVideo } from '@/components/landing/mini-video'
import { Button } from '@/components/ui/button'
import {
  PREVIEW_READY_CHANGES,
  PREVIEW_VIDEOS,
} from '@/constants/landing.constants'
import type { ILandingCopy } from '@/models/landing.interface'

interface ILandingHeroProps {
  copy: ILandingCopy
}

export function LandingHero({ copy }: ILandingHeroProps): JSX.Element {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="mx-auto grid min-h-[640px] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_.95fr]">
        <div className="relative z-10 max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            {copy.badge}
          </div>
          <h1 className="font-display text-5xl font-extrabold leading-[1.03] text-foreground sm:text-7xl">
            {copy.tagline}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
            {copy.sub}
          </p>
          <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Button size="lg" className="shadow-lg shadow-primary/20">
              <span className="grid size-6 place-items-center rounded-full bg-primary-foreground text-xs font-black text-primary">
                G
              </span>
              {copy.continue}
              <ArrowRight className="rtl:rotate-180" />
            </Button>
            <span className="max-w-xs text-xs leading-5 text-muted-foreground">
              <ShieldCheck className="me-1 inline size-4 text-success" />
              {copy.privacy}
            </span>
          </div>
        </div>
        <LandingHeroPreview copy={copy} />
      </div>
    </section>
  )
}

function LandingHeroPreview({ copy }: ILandingHeroProps): JSX.Element {
  return (
    <div className="relative min-h-[430px]">
      <div className="absolute inset-x-0 top-6 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 font-semibold">
            <Copy className="size-4 text-primary" />
            {copy.previewTitle}
          </div>
          <span className="rounded-full bg-success-soft px-2 py-1 text-xs font-semibold text-success">
            {copy.previewReady}
          </span>
        </div>
        <div className="grid gap-0 md:grid-cols-2">
          <div className="border-e border-border p-4">
            <p className="mb-3 text-xs font-bold uppercase text-muted-foreground">
              {copy.previewSource}
            </p>
            {PREVIEW_VIDEOS.slice(0, 3).map((video) => (
              <MiniVideo key={video.id} video={video} />
            ))}
          </div>
          <div className="bg-muted/40 p-4">
            <p className="mb-3 text-xs font-bold uppercase text-muted-foreground">
              {copy.previewDestination}
            </p>
            {PREVIEW_VIDEOS.slice(1, 4).map((video) => (
              <MiniVideo key={video.id} video={video} />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border bg-card px-4 py-3">
          <span className="text-sm">
            <b>{PREVIEW_READY_CHANGES}</b> {copy.previewChanges}
          </span>
          <Button size="sm">{copy.previewSave}</Button>
        </div>
      </div>
    </div>
  )
}
