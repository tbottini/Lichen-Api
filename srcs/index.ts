require("dotenv").config({ path: getEnvFile() });
const pkg = require("../package.json");
const cors = require("cors");
const users = require("./route/users");
const logger = require("./modules/logger");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const PORT = 8080; // default port to listen
const { createIPX, createIPXMiddleware } = require("ipx");
const ipx = createIPX();
const middlewareLogger = require("./modules/middleware-logger");

const projects = require("./route/projects"),
	events = require("./route/events"),
	artworks = require("./route/artworks"),
	news = require("./route/news");
const expressSwagger = require("express-swagger-generator")(app);
expressSwagger(require("./swagger.options.js"));

if (process.env.DATABASE_URL == null) {
	logger.error("env DATABASE_URL isnt defined");
	process.exit(1);
}

if (process.env.NODE_ENV != "production") app.use(cors());

app.use(middlewareLogger)
	.use(express.json())
	.use("/_ipx", createIPXMiddleware(ipx))
	.use(bodyParser.urlencoded({ extended: false }))
	.use(bodyParser.json())
	.use(express.static("public"));

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

if (process.env.NODE_ENV !== "test" && false) {
	// start the Express server
	app.listen(PORT, () => {
		logger.info(`server started at http://localhost:${PORT}
		/api-docs for documentation
		`);
	});
}

require("greenlock-express")
	.init({
		packageRoot: __dirname + "/../",
		configDir: "./greenlock.d",
		maintainerEmail: "thomasbottini@protonmail.com",
		cluster: false,
		packageAgent: pkg.name + "/" + pkg.version
	})
	.serve(function (req, res) {
		app(req, res);
	});

function getEnvFile(): string {
	switch (process.env.NODE_ENV) {
		case "production":
			return ".env";
		case "test":
			return ".env.test";
		case "dev":
			return ".env.dev";
		default:
			throw new Error(
				"env variable NODE_ENV isn't not valid value : production / dev / test"
			);
	}
}

module.exports = app;
