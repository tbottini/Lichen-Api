var mailer = require("nodemailer");
const logger = require("../logger");

class GmailSender
{
    constructor(mail, password) 
    {
        this.transporter = mailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.SENDER_MAIL,
              pass: process.env.SENDER_MAIL_PSW
            }
          });
        
        this.transporter.verify(function (error, success) {
            if (error) {
              logger.error(error);
              throw new Error("MailSender - doesn't work");
            } else {
              logger.info("Server is ready to take our messages");
            }
          });
    }

    async send(to, from, subject, message, attachments)  
    {
        var mailOptions = {
            from: from,
            to: to,
            subject: subject,
            html: message,
            attachments: attachments
          };
          
          logger.info("sendmail: " + subject + " to " + addr);
          var res = await this.sender.sendMail(mailOptions);
          logger.debug(res);

          return res; 
    }
}

//transporter who use gmail service
function createGmailService() {
    logger.info("Creation Gmail Service with mail " + process.env.SENDER_MAIL);
    
    if (process.env.SENDER_MAIL == null)
    {
      logger.error("SENDER_MAIL env variable is unset");
    }
    if (process.env.SENDER_MAIL_PSW == null)
    {
      logger.error("SENDER_MAIL_PSW env variable is unset");
    }

    return new GmailSender(process.env.SENDER_MAIL, process.env.SENDER_MAIL_PSW);
  }
  
module.exports = { createGmailService };