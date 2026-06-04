import { useState } from "react";
import clientLogger from "@/lib/logger/logger.client";

const useClipboard = () => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback per browser più vecchi
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      return true;
    } catch (err) {
      void clientLogger.error({ error: err }, "Failed to copy text");
      return false;
    }
  };

  return { isCopied, copyToClipboard };
};

export default useClipboard;
