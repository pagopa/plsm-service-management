"use client";

import { ColumnDef } from "@tanstack/react-table";

export type Log = {
  id: string;
  timestamp: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  service: string;
  message: string;
  request?: string;
};

export const columns: ColumnDef<Log>[] = [
  {
    accessorKey: "timestamp",
    header: "Data ed ora",
  },
  {
    accessorKey: "level",
    header: "Livello",
  },
  {
    accessorKey: "service",
    header: "Service",
  },
  {
    accessorKey: "message",
    header: "Messaggio",
  },
  {
    accessorKey: "request",
    header: "Richiesta",
  },
];
