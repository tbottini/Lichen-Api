import { PrismaClient } from '@prisma/client'
var ZoneAttribute = require("../attr/zone");
const prisma = new PrismaClient()
import logger from "../modules/logger";


/**
 * 
 * @param idUser 
 * @param limit 
 * @param zone : the research zone of artists
 * @returns des oeuvres que l'utilisateurs n'a pas liké et que ne lui appartiennent pas
 */
async function getRandomArtwork(idUser : number, limit: number, zone: ZoneAttribute)
{
    
    var whereZone = "";
    var innerJoinZone = "";
    const INNER_JOIN_GALLERY = `
    inner join
        "Gallery" as gallery
    on
        gallery."userId" = u.id
    `;
    var zoneSelector = "";
    if (zone != null)
    {
        //on fait un inner join de la gallery
        //et on ajoute une condition where
        var zoneFilter = zone.getZoneFilterPrisma();
        whereZone = `
        and
            gallery.latitude >= ${zoneFilter?.minLatitude}
        and
            gallery.latitude <= ${zoneFilter?.maxLatitude}
        and
            gallery.longitude >= ${zoneFilter?.minLongitude}
        and
            gallery.longitude <= ${zoneFilter?.maxLongitude}
        `;

        innerJoinZone = INNER_JOIN_GALLERY;

         zoneSelector = ", gallery.longitude, gallery.latitude ";
        
    }


    const getter = `
    select
        a.*, p.title, u.firstname, u.lastname, u.id as author ${zoneSelector}
    from
        "Artwork" as a
    inner join
        "Project" as p
    on
        a."projectId" = p.id
    inner join
        "User" as u
    on
        u.id = p."authorId"
    ${innerJoinZone}
    where
        u.id != ${idUser}
    and
        u."geoReferenced" = true
    and 
     a.id not in       
        (
        select
            a.id
        from 
            "Artwork" as a 
        inner join 
            "ArtworkLikes" as au 
        on
            a.id = au."artworkId" 
        inner join
            "User" as u
        on 
        u.id = au."userId" 
        where 
            u.id = ${idUser}
    )
    
    ${whereZone}

    order by
        random()
    limit ${limit}
    `


    logger.debug(getter);

    return await prisma.$queryRawUnsafe<any[]>(getter);
}

module.exports = {getRandomArtwork}