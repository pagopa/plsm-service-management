import nodemailer from "nodemailer";
import { serverEnv } from "@/config/env";

type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail({ to, subject, text }: SendEmailParams) {
  const transporter = nodemailer.createTransport({
    host: serverEnv.SMTP_HOST,
    port: Number(serverEnv.SMTP_PORT),
    secure: Number(serverEnv.SMTP_PORT) === 465, // SSL se porta 465
    auth: {
      user: serverEnv.SMTP_USER,
      pass: serverEnv.SMTP_PASS,
    },
  });

  const response = await transporter.sendMail({
    from: `"My App" <${serverEnv.SMTP_USER}>`,
    to,
    subject,
    text,
  });

  console.log(response);
}
