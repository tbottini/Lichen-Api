export class ZoneBoundary {
  public readonly minLatitude
  public readonly minLongitude
  public readonly maxLatitude
  public readonly maxLongitude

  constructor({ minLatitude, minLongitude, maxLatitude, maxLongitude }) {
    this.minLatitude = minLatitude
    this.minLongitude = minLongitude
    this.maxLatitude = maxLatitude
    this.maxLongitude = maxLongitude
  }

  print() {
    console.log(
      'zone: ',
      this.minLatitude,
      this.maxLatitude,
      this.minLongitude,
      this.maxLongitude
    )
  }
}

export function getLatitudeFilterForBoundary(boundary: ZoneBoundary) {
  return {
    lte: boundary.maxLatitude,
    gte: boundary.minLatitude,
  }
}

export function getLongitudeFilterForBoundary(boundary: ZoneBoundary) {
  return {
    lte: boundary.maxLongitude,
    gte: boundary.minLongitude,
  }
}
