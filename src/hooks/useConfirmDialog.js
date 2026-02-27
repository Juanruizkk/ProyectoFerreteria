import { useState } from "react";

export function useConfirmDialog(onConfirm) {
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);

  const openDialog = (data) => {
    setItem(data);
    setOpen(true);
  };

  const closeDialog = () => {
    setItem(null);
    setOpen(false);
  };

  const confirm = async () => {
    if (!item || !onConfirm) return;

    try {
      setLoading(true);
      await onConfirm(item);
      closeDialog();
    } finally {
      setLoading(false);
    }
  };

  return {
    open,
    item,
    loading,
    openDialog,
    closeDialog,
    confirm,
  };
}