export function sortSearchedElements<T>(
  researchElements: T[],
  token: string,
  getSearchKey: (element: T) => string
): T[] {
  const elements = researchElements
    .map(researchItem => {
      const searchableEntry = getSearchKey(researchItem)

      if (!searchableEntry.length) {
        return null
      }
      const matchPoints = highChain(token, searchableEntry)

      return { element: researchItem, matchPoints }
    })
    .filter(
      searchableEntry => searchableEntry && searchableEntry.matchPoints > 0
    )
    .sort(function (a, b) {
      return b!.matchPoints - a!.matchPoints
    }) as SearchedContainer<T>[]

  return elements
    .filter(
      researchItem => elements[0].matchPoints - researchItem!.matchPoints < 5
    )
    .map(item => {
      return item.element
    })
}

type SearchedContainer<T> = {
  element: T
  matchPoints: number
}

function highChain(token: string, search: string) {
  let correspondingValue = 0

  //sup is a variable who'll allow to count if the first letter is the same
  let correspondingValueBonus = 0

  if (search[0]?.toLowerCase() == token[0]?.toLowerCase())
    correspondingValueBonus += 3
  let j = 0,
    i = 0
  while (search[j] && correspondingValue < search.length - i) {
    while (
      token[i]?.toLowerCase() == search[j]?.toLowerCase() &&
      token[i]?.toLowerCase() &&
      search[j]?.toLowerCase()
    ) {
      i++
      j++
    }
    if (i > correspondingValue) {
      correspondingValue = i
      i = 0
    }
    j++
  }
  return correspondingValue + correspondingValueBonus
}
