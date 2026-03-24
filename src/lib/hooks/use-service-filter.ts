"use client";

import { create } from "zustand";

interface ServiceFilterState {
  activeService: string;
  setActiveService: (service: string) => void;
}

export const useServiceFilter = create<ServiceFilterState>((set) => ({
  activeService: "all",
  setActiveService: (service) => set({ activeService: service }),
}));
