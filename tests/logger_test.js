const winston = require("winston");
const { combine, colorize } = winston.format;
const { File, Console } = winston.transports;
const levels = {
	fatal: 0,
	error: 1,
	warn: 2,
	info: 3,
	debug: 5,
	http: 4
};

const logFormat = winston.format.printf(function(info) {

    return `${info.level}: ${
      (typeof info.message == "string") ? info.message :  
      ('\n' + JSON.stringify(info.message, null, 4))}`;
  });

const logger = winston.createLogger({
    levels, 
    format: combine(colorize(), logFormat),
    transports: [
        new Console({
            level: 'http', 
         
        }), 
        new File({
            filename: 'test.log'
            level: 'http',
        })
    ]
})

module.exports = logger;