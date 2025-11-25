"use client";

import { useCallback, useMemo, useState } from "react";
import { AskMeAnythingTable } from "./table";
import { askMeAnythingColumns } from "./columns";
import { AskMeAnythingMember } from "@/lib/services/ask-me-anything.service";
import {
  AskMeAnythingEditMemberDialog,
  type AskMeAnythingMemberFormValues,
} from "./member-dialog";

export interface AskMeAnythingTableSectionProps {
  initialRows: AskMeAnythingMember[];
}

export function AskMeAnythingTableSection({
  initialRows,
}: AskMeAnythingTableSectionProps) {
  const [rows, setRows] = useState<AskMeAnythingMember[]>(initialRows);
  const [editingMember, setEditingMember] =
    useState<AskMeAnythingMember | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const columns = useMemo(() => askMeAnythingColumns(), []);

  const handleRowClick = useCallback((member: AskMeAnythingMember) => {
    setEditingMember(member);
    setIsEditDialogOpen(true);
  }, []);

  const handleEditDialogOpenChange = useCallback((open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setEditingMember(null);
    }
  }, []);

  const handleMemberUpdate = useCallback(
    (updatedMember: AskMeAnythingMemberFormValues) => {
      if (!updatedMember.id) {
        return;
      }

      setRows((prev) =>
        prev.map((member) =>
          member.id === updatedMember.id
            ? { ...member, ...updatedMember }
            : member,
        ),
      );
      setEditingMember((prev) =>
        prev && prev.id === updatedMember.id
          ? { ...prev, ...updatedMember }
          : prev,
      );
    },
    [],
  );

  return (
    <>
      <AskMeAnythingTable
        columns={columns}
        data={rows}
        onRowClick={handleRowClick}
      />

      <AskMeAnythingEditMemberDialog
        member={editingMember}
        open={Boolean(editingMember) && isEditDialogOpen}
        onOpenChange={handleEditDialogOpenChange}
        onSuccess={handleMemberUpdate}
      />
    </>
  );
}
