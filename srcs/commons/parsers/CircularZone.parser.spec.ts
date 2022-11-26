import { parseRawZone } from './CircularZone.parser'

describe('Circular zone parser', () => {
  it('should parse correctly circular zone', () => {
    const zoneAttribute = parseRawZone('10', '15.5', '100')

    expect(zoneAttribute).toBeDefined()
    expect(zoneAttribute).toMatchObject({
      latitude: 10,
      longitude: 15.5,
      radius: 100,
    })
  })

  it('should throw if we pass a NaN as longitude or latitude', () => {
    expect(() => parseRawZone('aaa', '15.0', '100')).toThrow()
  })
})
