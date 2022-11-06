

/// Class Attribut gérant le filtre de Zone
/// ce filtre va chercher dans la base de données
/// toutes les coordonnées à l'intérieur du périmètres
/// ce périmètre est défini grace à une position [centre]
/// et un rayon [double]
class ZoneAttribute
{
	latitude: number; 
	longitude: number; 
	radius: number; 

	constructor(latitude, longitude, radius )
	{
		this.latitude = parseFloat(latitude); 
		this.longitude = parseFloat(longitude);
		this.radius = parseFloat(radius);
	}

	static parse(latitude : number, longitude: number, radius: number) : ZoneAttribute | undefined
	{
		if (latitude == null || longitude == null || radius == null)
		{
			return undefined; 
		}

		return new ZoneAttribute(
			latitude, 
			longitude, 
			radius
		);
	}

	/**
	 * va transformer le périmètre en objet filtre utilisable par prisma
	 */
	getZoneFilter() 
	{
		return ZoneFilterPrisma.fromZoneAttribute(this).filter;
	}

	getZoneFilterPrisma()
	{
		return ZoneFilterPrisma.fromZoneAttribute(this).zone;
	}

	isUnderCircleZone(point: Position) : boolean
	{
		return ZoneFilterPrisma.fromZoneAttribute(this).isUnderCircleZone(point);
	}

}

class ZoneFilterPrisma
{
	center: Position;	
	radius: number; 
	zone: Zone | undefined; 
	radiusDegreesLagitude? : number; //we take latitude for more simplicity

	constructor(longitude: number, latitude: number, radius: number)
	{
		this.center = new Position(latitude, longitude);
		this.radius = radius;
		this.radiusDegreesLagitude = undefined;
		this.zone = this.determineZone(this.radius, this.center);
	
	}

	static fromZoneAttribute(attr: ZoneAttribute)
	{
		return new ZoneFilterPrisma(attr.longitude, attr.latitude, attr.radius);	
	}

	determineZone(radiusKm : number, position : Position) : Zone
	{
		const distanceMeter = radiusKm * 1000;

		const distLat : number =  ( 180 / Math.PI ) * ( distanceMeter / 6378137 );
		const  distLong : number =  ( 180 / Math.PI ) * ( distanceMeter / 6378137 ) / Math.cos( position.latitude );
	
		this.radiusDegreesLagitude = distLat;

		const zone : Zone = new Zone(
			position.latitude - distLat, 
			position.latitude + distLat,
			position.longitude -  distLong, 
			position.longitude + distLong, 
		);

		return zone; 
	}

	isUnderCircleZone(point: Position) : boolean
	
	{

		const distTwoPoint = (point.latitude - this.center.latitude)**2 + (point.longitude - this.center.longitude)**2; //pythagore without racine² because
		//we'll compare to radius who's proportionally on ²

		console.log(distTwoPoint, (this.radiusDegreesLagitude! ** 2))

		return distTwoPoint < (this.radiusDegreesLagitude! ** 2);
	}

	filterPoints  (points: Array<Position>) : Array<Position> 
	{
		return points.filter((point) => this.isUnderCircleZone(point));
	}

	get filter ()
	{
		if (this.zone == null) return undefined;
		return {

			longitude: {
				lte: this.zone!.maxLongitude, 
				gte: this.zone!.minLongitude
			},
			latitude: {
				lte: this.zone!.maxLatitude, 
				gte: this.zone!.minLatitude
			}
		}
	}

	
}

class Position 
{
	latitude: number; 
	longitude: number; 

	constructor(latitude: number, longitude: number) 
	{
		this.latitude = latitude;
		this.longitude = longitude;
	}
}

class Zone 
{
	minLatitude: number; 
	minLongitude: number;
	maxLatitude: number; 
	maxLongitude: number; 

	constructor(minLat : number, maxLat: number, minLong : number, maxLong : number)
	{
		this.minLatitude = minLat;
		this.minLongitude = minLong;
		this.maxLatitude = maxLat;
		this.maxLongitude = maxLong;
	}

	print() 
	{
		console.log("zone: ", this.minLatitude, this.maxLatitude, this.minLongitude, this.maxLongitude);
	}
}

module.exports = {ZoneAttribute, Position};