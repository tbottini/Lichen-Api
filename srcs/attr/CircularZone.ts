import { Position } from '../commons/class/Position.class'
import { RepositoryZoneFilter } from '../swipe/repositories/RepositoryZoneFilter.class'

export class CircularZone {
  constructor(
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly radius: number
  ) {}

  static parse(
    latitude: string,
    longitude: string,
    radius: string
  ): CircularZone | undefined {
    if (latitude == null || longitude == null || radius == null) {
      return undefined
    }

    return new CircularZone(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(radius)
    )
  }

  /**
   * @deprecated
   */
  getZoneFilter() {
    return new RepositoryZoneFilter(this.longitude, this.latitude, this.radius)
      .filter
  }

  /**
   * @deprecated
   */
  getZoneFilterPrisma() {
    return new RepositoryZoneFilter(this.longitude, this.latitude, this.radius)
      .zone
  }

  /**
   * @deprecated
   */
  isUnderCircleZone(point: Position): boolean {
    return new RepositoryZoneFilter(
      this.longitude,
      this.latitude,
      this.radius
    ).pointIsInZone(point)
  }
}
