import { UserResponse } from "../../../services/user.service";
import getProduct from "../../../utils/getProduct";
import {
  blockButton,
  blockContext,
  blockDivider,
  blockSection,
  blockText,
} from "../../block";

export const getLegalCommandMessage = (
  fiscalCode: string,
  data: UserResponse,
) => {
  const productCount = data.onboardedInstitutions.length;

  const productEmojis: Record<string, string> = {
    IO: "🚀",
    SEND: "✉️",
    "Piattaforma pagoPA": "💳",
    Interoperabilità: "⚙️",
    "Interoperabilità Collaudo": "⚙️",
    "Interoperabilità Attestazione": "⚙️",
    "IO Premium": "🌟",
    "Firma con IO": "🖊️",
  };

  const blocks: Array<
    | ReturnType<typeof blockSection>
    | ReturnType<typeof blockDivider>
    | ReturnType<typeof blockContext>
    | { type: "header"; text: ReturnType<typeof blockText> }
  > = [
    {
      type: "header",
      text: blockText(
        `🔍 Ricerca Utente Completata (${data.user.name} ${data.user.surname})`,
        "plain_text",
        true,
      ),
    },
    blockSection({
      text: blockText(
        `Dettagli utente per Codice Fiscale: *\`${fiscalCode}\`*.`,
      ),
    }),
    blockSection({
      fields: [
        blockText(`*Nome:*\n${data.user.name}`),
        blockText(`*Cognome:*\n${data.user.surname}`),
      ],
    }),
    blockDivider(),
    blockSection({
      text: blockText(
        `### 📦 Registrazioni Prodotto Attive (${productCount} trovate)`,
      ),
    }),
    blockDivider(),
  ];

  if (productCount > 0) {
    data.onboardedInstitutions.forEach((institution) => {
      const productName = getProduct(institution.productInfo.id);
      const emoji = productEmojis[productName] ?? "📦";
      const status = institution.productInfo.status;

      blocks.push(
        blockSection({
          text: blockText(
            `*Prodotto:* ${emoji} ${productName}\n*Ragione Sociale:* ${institution.description}`,
          ),
          accessory: blockButton({
            text: blockText(`Stato: ${status}`, "plain_text", true),
            value: `status_${status}_${institution.id}`,
            action_id: `status_${institution.productInfo.id}`,
            style: status === "ACTIVE" ? "primary" : "default",
          }),
        }),
      );
      blocks.push(blockDivider());
    });
  } else {
    blocks.push(
      blockSection({
        text: blockText(
          ":eyes: Questo utente non ha nessun prodotto associato su Area Riservata. :eyes:",
        ),
      }),
      blockDivider(),
    );
  }

  blocks.push(
    blockContext({
      elements: [
        blockText(
          "_Fine report. Per assistenza, contatta il team di SM Service Management._",
          "mrkdwn",
        ),
      ],
    }),
  );

  return { blocks };
};
