import { sendMail } from "./src/utils/mailer.js";
sendMail({
  to: "tanishqsingh233001@gmail.com",
  subject: "Testing Brevo HTTP",
  html: "<p>It works!</p>"
});
