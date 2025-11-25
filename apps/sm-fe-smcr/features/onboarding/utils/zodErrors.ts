import { z } from "zod";
import { translations } from "./constants";
function translateZodField(
  path: (string | number | symbol)[] | undefined,
): string {
  if (!path) {
    return "";
  }
  const error = path[0];
  if (!error) {
    return "";
  }
  const errorString = error.toString();
  const translated = translations.get(errorString);
  if (translated) {
    return translated;
  } else {
    return errorString;
  }
}

const setupZodErrors = () => {
  z.config({
    customError: (iss) => {
      switch (iss.code) {
        case "too_small":
          if (iss.minimum) {
            const message = `Il campo ${translateZodField(iss.path)}  deve avere almeno ${iss.minimum} caratter${
              iss.minimum === 1 ? "e" : "i"
            }`;
            return { message };
          } else if (iss.exact) {
            const message = `Il campo ${translateZodField(iss.path)} deve avere esattamente ${iss.minimum} caratteri`;
            return { message };
          }
          break;

        case "too_big":
          if (iss.maximum) {
            const message = `Il campo ${translateZodField(
              iss.path,
            )} deve avere al massimo ${iss.maximum} caratter${
              iss.maximum === 1 ? "e" : "i"
            }`;
            return { message };
          }
          break;
      }
      return { message: iss.message ?? "" };
    },
  });
};

export { setupZodErrors };
