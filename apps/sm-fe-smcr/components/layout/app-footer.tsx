export function AppFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-5xl px-6 py-6">
        <p className="text-center text-sm leading-7 text-foreground">
          <strong>PagoPA S.p.A.</strong> - Società per azioni con socio unico -
          Capitale sociale di euro 1,000,000 interamente versato - Sede legale
          in Roma, Piazza Colonna 370,
          <br className="hidden md:block" />
          <span className="md:hidden"> </span>
          CAP 00187 - N. di iscrizione a Registro Imprese di Roma, CF e P.IVA
          15376371009
        </p>
      </div>
    </footer>
  );
}
