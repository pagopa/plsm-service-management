import { create } from "zustand";

export type InstitutionStoreValues = "address" | "zipCode" | "digitalAddress";

type Store = {
  values: {
    description: string;
    address: string;
    zipCode: string;
    digitalAddress: string;
  };
  updateValue: (key: string, value: string) => void;
  resetValues: (values: {
    description: string;
    address: string;
    zipCode: string;
    digitalAddress: string;
  }) => void;
};

const useStore = create<Store>((set) => ({
  values: {
    description: "",
    address: "",
    zipCode: "",
    digitalAddress: "",
  },
  updateValue: (key, value) =>
    set((state) => ({ values: { ...state.values, [key]: value } })),
  resetValues: (values) => set(() => ({ values })),
}));

export const useInstitutionStore = useStore;
