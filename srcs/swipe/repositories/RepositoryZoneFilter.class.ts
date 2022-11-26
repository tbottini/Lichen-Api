import { Position } from '../../commons/class/Position.class'
import { ZoneBoundary } from '../../commons/class/ZoneBoundary.class'

export class RepositoryZoneFilter {
  center: Position
  radius: number
  zone: ZoneBoundary | undefined
  radiusDegreesLagitude?: number //we take latitude for more simplicity

  constructor(longitude: number, latitude: number, radius: number) {
    this.center = new Position(latitude, longitude)
    this.radius = radius
    this.radiusDegreesLagitude = undefined
    this.zone = this.createZoneBoundary(this.radius, this.center)
  }

  createZoneBoundary(radiusKm: number, position: Position): ZoneBoundary {
    const radiusMeter = radiusKm * 1000

    const distLat: number = (180 / Math.PI) * (radiusMeter / 6378137)
    const distLong: number =
      ((180 / Math.PI) * (radiusMeter / 6378137)) / Math.cos(position.latitude)

    this.radiusDegreesLagitude = distLat

    const zone = new ZoneBoundary({
      minLatitude: position.latitude - distLat,
      maxLatitude: position.latitude + distLat,
      minLongitude: position.longitude - distLong,
      maxLongitude: position.longitude + distLong,
    })

    return zone
  }

  pointIsInZone(point: Position): boolean {
    const distTwoPoint =
      (point.latitude - this.center.latitude) ** 2 +
      (point.longitude - this.center.longitude) ** 2 //pythagore without racine² because
    //we'll compare to radius who's proportionally on ²

    return distTwoPoint < this.radiusDegreesLagitude! ** 2
  }

  filterPoints(points: Array<Position>): Array<Position> {
    return points.filter(point => this.pointIsInZone(point))
  }

  get filter() {
    if (this.zone == null) return undefined
    return {
      longitude: {
        lte: this.zone.maxLongitude,
        gte: this.zone.minLongitude,
      },
      latitude: {
        lte: this.zone.maxLatitude,
        gte: this.zone.minLatitude,
      },
    }
  }
}
