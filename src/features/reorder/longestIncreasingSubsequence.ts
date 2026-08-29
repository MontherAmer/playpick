/**
 * Indices of one longest strictly-increasing subsequence of `values`.
 *
 * Patience sorting: `tails[length - 1]` holds the index of the smallest value
 * that can end an increasing run of that length, and `previous` threads each
 * chosen index back to its predecessor so the run can be walked out at the end.
 * O(n log n).
 *
 * **Deterministic**: the same input always yields the same subsequence. A plan
 * that varied between runs would make retrying a partly-applied save
 * unpredictable, so the binary search deliberately settles ties one way and the
 * result is not sensitive to anything outside `values`.
 *
 * Pure, and exported separately from `buildMovePlan` so it can be exercised on
 * its own — it is the single computation the cost of a save depends on.
 */
export function longestIncreasingSubsequence(values: number[]): number[] {
  if (values.length === 0) return []

  /** `tails[k]` — index into `values` of the smallest tail of a run of length k+1. */
  const tails: number[] = []
  /** `previous[i]` — index of the element before `i` in the run ending at `i`. */
  const previous = new Array<number>(values.length).fill(-1)

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index]

    // Leftmost run whose tail is >= value: that run is the one this element
    // extends or replaces. Strictly increasing, so equal values do not extend.
    let low = 0
    let high = tails.length

    while (low < high) {
      const middle = (low + high) >> 1

      if (values[tails[middle]] < value) low = middle + 1
      else high = middle
    }

    if (low > 0) previous[index] = tails[low - 1]

    tails[low] = index
  }

  const result = new Array<number>(tails.length)
  let cursor = tails[tails.length - 1]

  for (let position = tails.length - 1; position >= 0; position -= 1) {
    result[position] = cursor
    cursor = previous[cursor]
  }

  return result
}
