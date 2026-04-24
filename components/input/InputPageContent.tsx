"use client";

import BackToHomeFab from "@/components/input/BackToHomeFab";
import TransactionForm from "@/components/transactions/TransactionForm";
import { useTransactionActions } from "@/hooks/useTransactionActions";

export default function InputPageContent() {
  const { addTransaction } = useTransactionActions();

  return (
    <>
    <section className="space-y-6 pb-24 md:pb-8">
      <div className="border border-black bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-500">
            /Input Form
          </p>
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
          Quickly record a new transaction.
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
          Use this form to add a new income or expense transaction. The transaction date can be set to the actual date it occurred, even if the entry is made later.
          </p>
  
      </div>

      <section className="border border-black bg-white p-4">
        <div className="mb-6 space-y-2 border-b border-dashed border-slate-300 pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-500">
            /Data Entry Form
          </p>
          <h2 className="text-2xl font-bold text-slate-900">
          Add transaction
          </h2>
          <p className="text-sm leading-6 text-slate-600">
          Once saved, the history, summary, and chart on the dashboard will be automatically updated.
          </p>
        </div>

        <TransactionForm
          submitLabel="Save transaction"
          onSubmit={addTransaction}
          resetAfterSubmit
        />
      </section>
    </section>
    <BackToHomeFab />
    </>
  );
}
