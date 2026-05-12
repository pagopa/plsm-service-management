export function AppFooter() {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-50 w-full border-t bg-background shadow-[0_-1px_0_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex min-h-[var(--app-footer-clearance)] max-w-6xl items-center px-6 py-3 md:px-8">
        <p className="text-center text-sm leading-6 font-medium text-foreground/90 md:text-[15px] md:leading-7">
          <strong className="font-semibold text-foreground">
            PagoPA S.p.A.
          </strong>{" "}
          - Società per azioni con socio unico - Capitale sociale di euro
          1,000,000 interamente versato - Sede legale in Roma, Piazza Colonna
          370,
          <br className="hidden md:block" />
          <span className="md:hidden"> </span>
          CAP 00187 - N. di iscrizione a Registro Imprese di Roma, CF e P.IVA
          15376371009
        </p>
      </div>
    </footer>
  );
}
