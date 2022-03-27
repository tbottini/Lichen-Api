require("dotenv").config();
const cors = require("cors");
const users = require("./route/users");
const logger = require("./modules/logger");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const port = 8080; // default port to listen
const { createIPX, createIPXMiddleware } = require("ipx");
const ipx = createIPX();
const middlewareLogger = require("./modules/middleware-logger");

const projects = require("./route/projects"),
	events = require("./route/events"),
	artworks = require("./route/artworks"),
	news = require("./route/news");
const expressSwagger = require('express-swagger-generator')(app);
expressSwagger(require("./swagger.options.js"))

logger.info("NODE_ENV", process.env.NODE_ENV);

if (process.env.DATABASE_URL == null) {
	logger.error("env DATABASE_URL isnt defined");
	process.exit(1);
}

if (process.env.NODE_ENV != "production")
	app.use(cors())

app
	.use(middlewareLogger)
	.use(express.json())
	.use("/_ipx", createIPXMiddleware(ipx))
	.use(bodyParser.urlencoded({ extended: false }))
	.use(bodyParser.json())
	.use(express.static("public"))

// define a route handler for the default home page
app.get("/", (req, res) => {
	logger.info("hello world");
	res.send("Hello world!");
});

app.use("/users/", users.router)
	.use("/projects/", projects.router)
	.use("/events/", events.router)
	.use("/artworks/", artworks.router)
	.use("/news", news.router);

logger.info("NODE_ENV", process.env.NODE_ENV);

if (process.env.NODE_ENV !== "test") {
	// start the Express server
	app.listen(port, () => {
		logger.info(`server started at http://localhost:${port}
		/api-docs for documentation
		`);
	});
}

module.exports = app;
