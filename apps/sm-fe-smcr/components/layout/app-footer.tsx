export function AppFooter() {
  return (
    <footer className="w-full shrink-0 border-t bg-background py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] shadow-[0_-1px_0_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex max-w-6xl items-center px-6 md:px-8">
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
