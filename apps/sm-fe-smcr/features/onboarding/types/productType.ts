type ProdPagoPa = {
  tag: "prod-pagopa";
  value: string;
};

type ProdInterop = {
  tag: "prod-interop";
  value: string;
};

type ProdPn = {
  tag: "prod-pn";
  value: string;
};
type ProdIo = {
  tag: "prod-io";
  value: string;
};

type ProdIoSign = {
  tag: "prod-io-sign";
  value: string;
};

type ProdFdGarantito = {
  tag: "prod-fd-garantito";
  value: string;
};

export type ProductOptions = Array<
  ProdPagoPa | ProdInterop | ProdPn | ProdIo | ProdIoSign | ProdFdGarantito
>;
