import { useState } from "react";
import { FilledButton } from "./buttons";
import { Input } from "./comps";
import {
  CollectionOperationInterface,
  DisbursementOperationInterface,
  VaultDepositInterface,
  VaultWithdrawalInterface,
} from "../logiC/interfaces";

export function EditOperationDialog({
  operation_type,
  operation,
  onSubmit,
}: {
  operation_type: "account" | "vault";
  operation:
    | CollectionOperationInterface
    | DisbursementOperationInterface
    | VaultDepositInterface
    | VaultWithdrawalInterface;
  onSubmit: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    motif: operation.motif,
  });

  return (
    <div className="flex w-full flex-col gap-y-4 lg:w-[400px]">
      <Input
        placeholder="Motif"
        value={formData.motif}
        onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
      />
      <FilledButton onClick={() => onSubmit(formData)}>Submit</FilledButton>
    </div>
  );
}
