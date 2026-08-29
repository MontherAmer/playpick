import type { PlaylistPrivacy } from '@/models/playlist'

/**
 * A playlist the person is composing. It exists only in the form, and nothing
 * reaches YouTube until they submit it.
 */
export interface IPlaylistDraft {
  /** As typed, including surrounding whitespace. Trimmed only when submitted. */
  title: string
  /** As typed. Empty means "no description", not "an empty description". */
  description: string
  /**
   * **Starts `null`, deliberately.**
   *
   * `null` means *not yet chosen*, which is a distinct state from any of the
   * three values — and a field typed as `PlaylistPrivacy` alone could not
   * express it. Without that distinction the form could not tell an unmade
   * choice from a made one, and would create a playlist with a visibility
   * nobody picked.
   *
   * This is why the design's public-by-default was not carried over: neither
   * default is undoable from inside PlayPick, which offers no way to edit or
   * delete a playlist once it exists.
   */
  privacy: PlaylistPrivacy | null
}

/**
 * Why a field is not acceptable.
 *
 * A reason rather than a message, so the caller translates it and one result
 * serves both languages.
 */
export type FieldIssue = 'required'

/** Issues keyed by field, because each must be shown beside the field it concerns. */
export interface IDraftIssues {
  title?: FieldIssue
  privacy?: FieldIssue
}

/** A draft with nothing filled in, and no visibility assumed. */
export const EMPTY_DRAFT: IPlaylistDraft = {
  title: '',
  description: '',
  privacy: null,
}
