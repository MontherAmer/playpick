import type { IDraftIssues, IPlaylistDraft } from '@/models/playlistDraft'

/**
 * What is not acceptable about a draft, keyed by field.
 *
 * An empty result means the draft can be submitted.
 *
 * Returns **reasons, not messages**: the caller translates them, so one result
 * serves both languages, and each is shown beside the field it concerns rather
 * than pooled into a single message.
 *
 * ## What is deliberately not checked
 *
 * **Length, and which characters are allowed.** Google's documentation states no
 * maximum for a title or a description and lists no disallowed characters.
 * Inventing a limit would be wrong in both directions: too low and PlayPick
 * refuses titles YouTube would have accepted, with no way for the person to tell
 * the refusal is ours rather than YouTube's; too high and it does nothing at
 * all. A value YouTube refuses is surfaced as a failure attributed to its field
 * instead, which costs one request to discover and is honest about who refused.
 */
export function validatePlaylistDraft(draft: IPlaylistDraft): IDraftIssues {
  const issues: IDraftIssues = {}

  // Trimmed for the check only — the draft keeps what was typed until submitted.
  if (draft.title.trim() === '') {
    issues.title = 'required'
  }

  // `null` is "not yet chosen", and no visibility is assumed on anyone's behalf.
  if (draft.privacy === null) {
    issues.privacy = 'required'
  }

  return issues
}

/** Whether a draft can be submitted at all. */
export function isDraftSubmittable(draft: IPlaylistDraft): boolean {
  return Object.keys(validatePlaylistDraft(draft)).length === 0
}
