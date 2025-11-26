import CRMForm from "@/components/call-management/crm-form";
import SlackForm from "@/components/call-management/slack-form";

export default function Page() {
  return (
    <main className="w-full h-full bg-white flex items-center justify-center">
      <div className="p-4 inline-flex gap-8 border rounded-md">
        <div className="flex flex-col gap-4">
          <h1 className="font-medium text-lg">Invia messaggio su Slack</h1>
          <SlackForm />
        </div>

        <div>
          <div className="w-px bg-border h-full" />
        </div>

        <div>
          <h1 className="font-medium text-lg">Aggiorna CRM</h1>
          <CRMForm />
        </div>
      </div>
    </main>
  );
}
