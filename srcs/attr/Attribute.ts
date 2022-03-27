const _ = require("lodash");

abstract class Attribute 
{
    name : string;

    constructor(name) 
    {
        this.name = name;
    }

    /**
     * 
     *  value the value
     *  return true if there is an error
     */
    async parse(value) : Promise<boolean> {
        return false;
    }


    get value() : any { throw "err";};
    
}

class FloatAttribute extends Attribute 
{
    _value;

    constructor(name) 
    {
        super(name);
    }

    async parse(value) 
    {
        if (value == null)
        {
            this._value = null;
            return false;
        }
        this._value = parseFloat(value);
        if (isNaN(this._value))
            return false; 
        return true;
    }

    get value () {
        return this._value;
    }

}

export {FloatAttribute, Attribute};