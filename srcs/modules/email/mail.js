const fs = require("fs");
const { createMailjetService } = require("./mailjet");
const logger = require("../logger");

const senderDictConstructor = {
	mailjet: createMailjetService
};

/**
 * Class handling mail sending
 */
class MailSender {
	constructor(senderType) {
		if (senderType == null) senderType = "mailjet";

		logger.info("Mail Sender (" + senderType + ") Instantiate");

		// we instantiate the sender depending of the parameter
		if (process.env.NODE_ENV === "production") {
			this.sender = senderDictConstructor[senderType]();
		} else {
			logger.info(
				"Mail sender will not send mail due to NODE_ENV != production"
			);
		}
	}

	async send(subject, to, content, attachments, from = "no-reply@lychen.fr") {
		if (!to || !from || !subject) {
			throw new Error("Mail data missing");
		}
		if (process.env.NODE_ENV === "production") {
			await this.sender.send(to, from, subject, content, attachments);
		} else {
			console.log("[FAKE] try to send mail ", subject, "to", to);
		}
	}

	close() {
		this.sender.close();
	}
}

module.exports = {
	MailSender
};
