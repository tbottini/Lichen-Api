var mjml = require("mjml");
const fs = require("fs");
const { MailSender } = require("./mail");
const mailSender = new MailSender("mailjet");
const logger = require("../logger");

function readMjml(file) {
	// MjmlFile.folderPath can be null with the function setFolderPath

	if (MjmlFile.folderPath == null) {
		throw new Error("the folder path was update and is now null");
	}
	var file = fs.readFileSync(MjmlFile.folderPath + file + ".mjml");
	file = file.toString();
	return file;
}

function templatevar(file, name, value) {
	return file.replace(name, value);
}

class MjmlFile {
	constructor(url) {
		this.email = readMjml(url);
		this.initState = this.email;

		generateBasic({});
	}

	set(varname, value) {
		this.email = templatevar(this.email, "$" + varname, value);

		return this;
	}

	generate() {
		const basic = wrapBasic(this.email);

		const emailComplete = mjml(basic);
		return emailComplete.html;
	}

	get() {
		return this.email;
	}

	reset() {
		this.email = this.initState;
	}

	send(to, title) {
		const emailBody = this.generate();

		if (process.env.NODE_ENV == "development") {
			logger.info("CHANGE ADRESS - mode development");
			to = "thomasbottini@protonmail.com";
			title = "TEST - " + title;
		}

		mailSender.send(title, to, emailBody, []);

		return { msg: "the email has been sent" };
	}
}

// the folder path of mjml files
MjmlFile.folderPath = "./assets/email/";

var basicTemplate;

/**
 * for optimisation we generate the basic template
 * a template who'll wrap all mail automaticly
 */
var basicWasGenerate = false;

function generateBasic(param) {
	if (basicWasGenerate) return basicTemplate;

	const {
		linkFacebook,
		linkInstagram,
		linkYoutube,
		linkSoundcloud,
		linkTwitter
	} = param;
	var basic = readMjml("basic");
	basic = templatevar(basic, "$link-facebook", linkFacebook);
	basic = templatevar(basic, "$link-instagram", linkInstagram);
	basic = templatevar(basic, "$link-youtube", linkYoutube);
	basic = templatevar(basic, "$link-soundcloud", linkSoundcloud);
	basic = templatevar(basic, "$link-twitter", linkTwitter);
	basicTemplate = basic;
	logger.info("MjmlFile - Basic Template was generate");
	basicWasGenerate = true;
	return basic;
}

function wrapBasic(body) {
	return templatevar(basicTemplate, "$email-body", body);
}

function mailTest() {
	var testMail = new MjmlFile("testMail");

	return testMail;
}

function resetPassword(param) {
	var resetMail = new MjmlFile("reinit");
	return resetMail
		.set("token", param.token)
		.set("id", param.id)
		.set("firstname", param.firstname || "")
		.set("lastname", param.lastname || "")
		.set("email", param.email || "");
}

/**
 * will update the folder of mjml files ressources
 */
function setFolderMjmlFile(path) {
	MjmlFile.folderPath = path;
	logger.info("MjmlFile - ressources folder path was update to : " + path);
}

module.exports = {
	resetPassword,
	init: generateBasic,

	mailTest,
	// mailConfirmationNewAccount,
	setFolderMjmlFile
};
