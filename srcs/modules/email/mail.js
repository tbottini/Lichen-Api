const fs = require("fs");
const { createMailjetService } = require("./mailjet");
const logger = require("../logger")
// const { createGmailService } = require("./gmail");

//TODO incopore into MailSender contructor variable
var personnalHostEmail = "thomasbottini@protonmail.com";

const senderDictConstructor = {
  // "gmail": createGmailService, 
  "mailjet": createMailjetService
}

/**
 * Class handling mail sending
 */
class MailSender {
  constructor(senderType) {
    if (senderType == null)
      senderType = "mailjet";

    logger.info("Mail Sender (" + senderType + ") Instantiate");

    // we instantiate the sender depending of the parameter
    this.sender = senderDictConstructor[senderType]();
  }

  async send(
    subject,
    to,
    content,
    attachments,
    from = "no-reply@lychen.fr"
  ) {
    if (!to || !from || !subject) 
      throw new Error("Mail data missing");
    await this.sender.send(to, from, subject, content, attachments);
  }

  // async resetPassword(addr, token) {
  //   var content = fs
  //     .readFileSync("./views/mail/resetPassword.html")
  //     .toString()
  //     .split("<token>")
  //     .join(token);

  //   send("Forgot Password", addr, content, [
  //     {
  //       filename: "lock.svg",
  //       path: "./views/lock.svg",
  //       cid: "unique@nodemailer.com"
  //     }
  //   ]);
  // }

  // async notificationMail(email, message) {
  //   var content = fs
  //     .readFileSync(__dirname + "/../views/notifMail.html")
  //     .toString()
  //     .split("<email>")
  //     .join(email)
  //     .split("<message>")
  //     .join(message);
  //   send("Notification", personnalHostEmail, content, []);
  // }

  close() {
    this.sender.close();
  }
}

module.exports = {
  MailSender: MailSender,
  // createGmailService: createGmailService,
  // notificationMail: MailSender.notificationMail,
  // resetPassword: MailSender.resetPassword
};
