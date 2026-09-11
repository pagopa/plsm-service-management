import { create } from "zustand";

export type InstitutionStoreValues =
  | "description"
  | "address"
  | "zipCode"
  | "digitalAddress"
  | "origin"
  | "originId";

type Values = Record<InstitutionStoreValues, string>;

type Store = {
  values: Values;
  updateValue: (key: string, value: string) => void;
  resetValues: (values: Values) => void;
};

const useStore = create<Store>((set) => ({
  values: {
    description: "",
    address: "",
    zipCode: "",
    digitalAddress: "",
    origin: "",
    originId: "",
  },
  updateValue: (key, value) =>
    set((state) => ({ values: { ...state.values, [key]: value } })),
  resetValues: (values) => set(() => ({ values })),
}));

export const useInstitutionStore = useStore;
