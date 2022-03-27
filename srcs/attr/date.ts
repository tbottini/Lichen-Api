import logger from "../modules/logger";

class DateAttr 
{
    date: Date;
    error: Boolean;
    errorMsg? : String;

    constructor(str: string | number)
    {
        var date;
        if (str != null && str != "null")
        {
            logger.debug("DATE PARSE", str, typeof str);
            if (typeof str == "string")
            {
                if (!Number.isNaN(Number(str)))
                {
                    date = new Date(Number(str));
                }
                // if the string is an string and not a number, it's a date string
                else 
                {
                    date = new Date(Date.parse(str));
                }
            }
            else if (typeof str == "number")
            {
                date = new Date(str);
            } 
            else 
            {
                date = new Date("error");
            }
            logger.debug("DATE --", date);
            this.error = isNaN(date.getTime());
            this.date = date;
        }
        else 
        {
            this.error = false;
            this.date = new Date("error");
        }

        logger.debug("RESULT", this.error, this.date)

        
    }

    get value() {
        if (this.date == undefined)
            return undefined
        if (isNaN(this.date.getTime()))
            return undefined;
        return this.date
    }
}

module.exports = DateAttr