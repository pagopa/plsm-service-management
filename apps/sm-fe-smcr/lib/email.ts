import nodemailer from "nodemailer";

type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail({ to, subject, text }: SendEmailParams) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465, // SSL se porta 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const response = await transporter.sendMail({
    from: `"My App" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  });

  console.log(response);
}
