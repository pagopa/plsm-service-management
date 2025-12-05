import {
  AllMiddlewareArgs,
  BlockButtonAction,
  SlackActionMiddlewareArgs,
} from "@slack/bolt";
import { envData } from "../../../utils/validateEnv";
import nodemailer from "nodemailer";
import getProduct from "../../../utils/getProduct";
import { getInstitution } from "../../../services/institution.service";
import messages from "../../../utils/messages";
import {
  getUserEmailById,
  hasSelfcareAccess,
} from "../../../services/auth.service";

const transporter = nodemailer.createTransport({
  host: envData.SMTP_HOST,
  port: envData.SMTP_PORT,
  secure: envData.SMTP_SECURE,
  auth: {
    user: envData.SMTP_USERNAME,
    pass: envData.SMTP_PASSWORD,
  },
});

const contractAction = async ({
  body,
  ack,
  say,
}: SlackActionMiddlewareArgs<BlockButtonAction> & AllMiddlewareArgs) => {
  await ack();
  if (!body || !body.actions || !body.actions[0] || !body.actions[0].value) {
    return;
  }

  const [taxCode, productId, subunitCode] = body.actions[0].value.split("_");

  try {
    const institution = await getInstitution(taxCode, subunitCode);
    const email = await getUserEmailById(body.user.id);
    const isAuthorized = await hasSelfcareAccess(body.user.id);

    if (email.error || !email) {
      await say(email.error);
      return;
    }

    if (isAuthorized.error) {
      await say(isAuthorized.error);
      return;
    }

    const response = await fetch(
      `${envData.CONTRACT_URL}/${institution.id}/contract?productId=${productId}`,
      {
        method: "GET",
        headers: {
          "Ocp-Apim-Subscription-Key": envData.CONTRACT_APIM_SUBSCRIPTION_KEY,
        },
      },
    );

    if (response.status === 404) {
      throw new Error(messages.contract.notFound);
    }

    if (!response.ok) {
      throw new Error(messages.contract.error);
    }

    const contentDisposition = response.headers.get("content-disposition");
    if (!contentDisposition || contentDisposition === null) {
      throw new Error(messages.contract.error);
    }

    const regex = /filename=([^;]+)$/;
    const filename = contentDisposition.match(regex)?.[1].split("/").pop();

    const responseBody = await response.arrayBuffer();
    const buf = Buffer.from(responseBody);

    const mailOptions = {
      from: envData.FROM_EMAIL,
      to: email.data!,
      bcc: envData.CCN_EMAIL,
      subject: "Richiesta contratto - Bot Service Management",
      html: `<p>Ciao,<br />in allegato trovi il contratto <b>${getProduct(productId)}</b> per l’ente <b>${institution.description}</b> con codice fiscale <b>${taxCode}</b>, richiesto sul Bot Ask Me Everything del Team Service Management - Selfcare.<br /><br />Un Saluto.<br /></p>`,
      attachments: [
        {
          filename,
          content: buf,
          encoding: "binary",
          contentType: "application/octet-stream",
        },
      ],
    };

    transporter.sendMail(mailOptions);
    await say(messages.contract.emailSent);
  } catch (error) {
    if (error instanceof Error) {
      say(error.message);
    } else {
      say(messages.errors.generic);
    }
  } finally {
    return;
  }
};

export default contractAction;
