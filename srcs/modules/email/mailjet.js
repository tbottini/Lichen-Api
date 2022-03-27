const mailjet = require("node-mailjet");
const logger = require("../logger");

function createMailjetService() {
	return new MailjetSender(
		process.env.MAILJET_APIKEY_PUBLIC,
		process.env.MAILJET_APIKEY_PRIVATE
	);
}

class MailjetSender {
	constructor(publicKey, privateKey) {
		if (publicKey == null)
		{
			throw new Error("MailjetSender - MAILJET_APIKEY_PUBLIC is  undefined");
		}
		if (privateKey == null) {
			throw new Error("MailjetSender - MAILJET_APIKEY_PRIVATE is undefined");

		}
		this.sender = mailjet.connect(
			publicKey, 
			privateKey
		);
	}

	async send(to, from, subject, message, attachments) {

        //mailjet need the base64 data of attachments for sending them
        attachments = attachments?.map((attach) => {
            return {
                "ContentType": attach.contentType, 
                "Filename": attach.filename,
                "ContentID": attach.cid,
                "Base64Content": fs.readFileSync(attach.path, {encoding: 'base64'})
            };
        });


		var res = this.sender.post("send", { version: "v3.1" }).request({
			Messages: [
				{
					From: {
						Email: from
						// "Name": ""
					},
					To: [
						{
							Email: to
							// "Name": "passenger 1"
						}
					],
					Subject: subject,

					HTMLPart: message, 
                    attachments
				}
			]
		});

		logger.info(`Sending a mail to ${to} : "${subject}"`);

		// logger.info(res.body);
	}
}

module.exports = { createMailjetService };
