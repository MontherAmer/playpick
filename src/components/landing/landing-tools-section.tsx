import type { JSX } from 'react'

import { ArrowRight } from 'lucide-react'

import type { ILandingCopy, IToolDefinition, Locale, ToolId } from '@/models/landing.interface'

interface ILandingToolsSectionProps {
  locale: Locale
  copy: ILandingCopy
  tools: IToolDefinition[]
  onToolSelect: (toolId: ToolId) => void
}

export function LandingToolsSection({
  locale,
  copy,
  tools,
  onToolSelect,
}: ILandingToolsSectionProps): JSX.Element {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="text-sm font-bold text-primary">{copy.toolboxLabel}</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
            {copy.toolboxTitle}
          </h2>
        </div>
        <p className="hidden max-w-sm text-sm text-muted-foreground md:block">
          {copy.toolboxDescription}
        </p>
      </div>
      <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
        {tools.map((tool) => (
          <button
            key={tool.id}
            id={tool.id}
            type="button"
            onClick={() => {
              onToolSelect(tool.id)
            }}
            className="group min-h-48 bg-card p-5 text-start transition-colors hover:bg-accent"
          >
            <tool.icon className="size-6 text-primary" />
            <h3 className="mt-10 font-display text-lg font-bold">
              {locale === 'ar' ? tool.ar : tool.label}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{tool.desc}</p>
            <ArrowRight className="mt-4 size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180" />
          </button>
        ))}
      </div>
    </section>
  )
}
