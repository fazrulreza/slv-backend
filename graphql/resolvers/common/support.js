const emailer = require('../../../packages/emailer');
const logger = require('../../../packages/logger');
const { generateHistory } = require('../../../packages/mysql-model');

module.exports = {
  Mutation: {
    sendSupportMail: async (
      parent, { input },
    ) => {
      logger.info(`sendSupportMail --> for public with input ${JSON.stringify(input)}`);

      const {
        source, email, phone, subject, description, name,
      } = input;

      const { CREATED_AT } = generateHistory(email, 'CREATE');

      const emailInfo = await emailer.sendMail({
        from: '"ELSA" <noreply@smebank.com.my>', // sender address
        to: 'support@cedar.my', // list of receivers
        subject: `[ELSA][${source}] - ${subject}`, // Subject line
        text: `[ELSA][${source}] - ${subject}`, // plain text body
        html: `
        <div>
            <h3>Inquiry / Issue received for ELSA-${source}</h3>
            <br />
            <table align="center" width="80%" cellpadding="6px">
              <tr align="left">
                  <th style="border: 1px solid #dddddd">Name</th>
                  <td style="border: 1px solid #dddddd">${name}</td>
              </tr>
              <tr align="left">
                  <th style="border: 1px solid #dddddd">Email</th>
                  <td style="border: 1px solid #dddddd">${email}</td>
              </tr>
              <tr align="left">
                  <th style="border: 1px solid #dddddd">Phone No</th>
                  <td style="border: 1px solid #dddddd">${phone}</td>
              </tr>
              <tr align="left">
                  <th style="border: 1px solid #dddddd">Subject</th>
                  <td style="border: 1px solid #dddddd">${subject}</td>
              </tr>
              <tr align="left">
                  <th style="border: 1px solid #dddddd">Description</th>
                  <td style="border: 1px solid #dddddd">${description}</td>
              </tr>
              <tr align="left">
                  <th style="border: 1px solid #dddddd">Timestamp</th>
                  <td style="border: 1px solid #dddddd">${CREATED_AT}</td>
              </tr>
            </table>
        </div>`,
      });

      logger.debug(`sendSupportMail --> email sent: ${emailInfo.messageId}`);

      logger.info(`sendSupportMail --> by ${input.email} completed`);

      return 'OK';
    },
  },
};
