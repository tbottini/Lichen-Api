import { parsePosition } from './Position.parser'

describe('Parser position', () => {
  it('should parse position with correct data', () => {
    const position = parsePosition({
      longitude: '40',
      latitude: '30',
    })

    expect(position).toMatchObject({
      longitude: 40,
      latitude: 30,
    })
  })

  it('should throw an error when latitude is NaN', () => {
    expect(() =>
      parsePosition({
        longitude: '30',
        latitude: 'a',
      })
    ).toThrow()
  })
})
