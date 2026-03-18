import CRMForm from "@/components/call-management/crm-form";
import SlackForm from "@/components/call-management/slack-form";

export default function Page() {
  return (
    <main className="w-full min-h-full bg-muted/30 flex items-center justify-center p-6">
      <div className="flex flex-col flex-wrap gap-8 justify-center items-start max-w-6xl w-full lg:flex-row">
        <div className="flex flex-col gap-4 bg-white rounded-xl border shadow-sm p-6">
          <h1 className="font-medium text-lg">Invia messaggio su Slack</h1>
          <SlackForm />
        </div>

        <div className="flex flex-col gap-4 bg-white rounded-xl border shadow-sm p-6 flex-1 min-w-0 max-w-2xl">
          <div className="text-center space-y-1">
            <h1 className="font-medium text-lg">Aggiorna CRM</h1>
            <p className="text-sm text-muted-foreground">
              Cerca un ente e aggiungi i partecipanti alla riunione.
            </p>
          </div>
          <CRMForm />
        </div>
      </div>
    </main>
  );
}
