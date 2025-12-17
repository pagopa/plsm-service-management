import {
  DividerBlock,
  MrkdwnElement,
  PlainTextElement,
  SectionBlock,
  TextObject,
  ActionsBlock,
  ActionsBlockElement,
} from "@slack/bolt";
interface SlackImage {
  type: "image";
  alt_tex: string;
  image_url?: string;
  slack_file?: {
    url?: string;
    id?: string;
  };
}
interface SlackTextObject {
  type?: string; // 'mrkdwn' | 'plain_text' // if not provided assume to be mrkdwn
  text: string;
  emoji?: boolean | null;
}
export const blockText = (
  text: string,
  type = "mrkdwn",
  emoji?: boolean | null,
): TextObject => {
  if (emoji && type !== "plain_text")
    throw new Error("Puoi usare emojy solo con plain_text");
  return {
    type,
    text,
    ...(emoji && { emoji }),
  } as MrkdwnElement | PlainTextElement;
};
interface SlackContext {
  type: "context";
  block_id?: string;
  elements: Array<SlackImage | SlackTextObject>;
}
interface SlackSection {
  type: "section";
  text?: SlackTextObject;
  block_id?: string;
  fields?: Array<SlackTextObject>; // required if not text provided
  accessory?: SlackButtonFields | SlackStaticSelect;
}
interface SlackStaticSelect {
  type: "static_select";
  action_id: string;
  options: Array<{ text: SlackTextObject; value: string }>;
  placeholder: SlackTextObject;
}
interface SlackButtonFields {
  text: SlackTextObject;
  value: string;
  action_id: string;
  style?: "danger" | "default" | "primary" | null;
}
interface SlackAction {
  type?: "actions";
  block_id: string;
  elements: Array<SlackButtonFields | SlackStaticSelect>;
}
export const blockContext = (options: Omit<SlackContext, "type">) => ({
  type: "context",
  ...(options.block_id ? { block_id: options.block_id } : {}),
  elements: options.elements,
});

export const blockSection = (
  options: Omit<SlackSection, "type">,
): SectionBlock => {
  if (!options.text && !options.fields)
    throw new Error("text or fields is required");
  return {
    type: "section",
    ...options,
  } as SectionBlock;
};

export const blockDivider = () => ({ type: "divider" }) as DividerBlock;

export const blockButton = (slackButtonFields: SlackButtonFields) => {
  const { text, value, action_id, style } = slackButtonFields;
  return {
    type: "button",
    text: { text: text.text, type: "plain_text", emoji: text.emoji },
    value,
    action_id,
    ...(style && { style }),
  } as SlackButtonFields;
};

export const blockSelect = (
  slackStaticSelect: Omit<SlackStaticSelect, "type">,
) => {
  const { options, placeholder, action_id } = slackStaticSelect;
  const fields = options.map((option) => ({
    ...option,
    text: { text: option.text.text, type: "plain_text" },
  }));
  return {
    type: "static_select",
    placeholder: {
      text: placeholder.text,
      type: "plain_text",
    },
    options: fields,
    action_id,
  } as SlackStaticSelect;
};

export const blockSectionSelect = (
  slackStaticSelect: Omit<SlackStaticSelect, "type"> & { label: string },
) => {
  const { options, placeholder, action_id, label } = slackStaticSelect;

  if (options.length < 1) {
    return undefined;
  }

  const fields = options.map((option) => ({
    ...option,
    text: { text: option.text.text, type: "plain_text" },
  }));

  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: label,
    },
    accessory: {
      type: "static_select",
      placeholder: {
        text: placeholder.text,
        type: "plain_text",
      },
      options: fields,
      action_id,
    },
  };
};

export const blockActions = (slackAction: SlackAction): ActionsBlock => {
  return {
    type: slackAction.type ?? "actions",
    block_id: slackAction.block_id,
    elements: slackAction.elements as Array<ActionsBlockElement>,
  };
};
