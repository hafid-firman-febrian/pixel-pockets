"use client";

import { useState, useTransition } from "react";

import { logoutAction } from "@/app/actions/auth";
import Modal from "@/components/ui/Modal";

export default function LogoutButton() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsConfirmOpen(true)}
        className="active:bg-red-300 hover:bg-red-300 px-2 cursor-pointer transition-colors font-mono"
      >
        /logout
      </button>

      {isConfirmOpen ? (
        <Modal
          title="Log out"
          description="Your session will be cleared. You'll need to enter the PIN to access Pixel-Pockets again."
          onClose={() => (isPending ? undefined : setIsConfirmOpen(false))}
        >
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isPending}
              className="border border-black bg-white px-4 py-3 text-sm font-bold uppercase text-slate-900 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className="border border-black bg-red-100 px-4 py-3 text-sm font-bold uppercase text-red-900 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:bg-red-50"
            >
              {isPending ? "Logging out…" : "Yes, log out"}
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
