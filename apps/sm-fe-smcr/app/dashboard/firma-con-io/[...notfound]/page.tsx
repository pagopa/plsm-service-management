import { ErrorBase } from "@/components/error/error-overview";

export default function CatchAllNotFound() {
  return (
    <ErrorBase
      title={"Errore nel recupero dati"}
      text1="Si è verificato un errore, riprova"
      text2="oppure effettua una nuova ricerca."
      route="firma-con-io"
    />
  );
}
