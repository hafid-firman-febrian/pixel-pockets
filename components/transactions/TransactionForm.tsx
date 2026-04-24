"use client";

import { useMemo, useState } from "react";

import {
  AMOUNT_STEP,
  CUSTOM_CATEGORY_OPTION,
  QUICK_AMOUNT_OPTIONS,
  createDefaultTransactionFormValues,
  type TransactionFormValues,
} from "@/lib/transaction-form";
import { formatCurrency } from "@/lib/dashboard";
import { TRANSACTION_CATEGORIES } from "@/lib/transactions";

interface TransactionFormProps {
  initialValues?: TransactionFormValues;
  submitLabel: string;
  onSubmit: (values: TransactionFormValues) => void;
  onCancel?: () => void;
  resetAfterSubmit?: boolean;
}

interface TransactionFormErrors {
  date?: string;
  amount?: string;
  category?: string;
  description?: string;
}

interface FormState {
  date: string;
  type: TransactionFormValues["type"];
  amountInput: string;
  categoryOption: string;
  customCategory: string;
  description: string;
}

function createFormState(initialValues?: TransactionFormValues): FormState {
  const values = initialValues ?? createDefaultTransactionFormValues();

  return {
    date: values.date,
    type: values.type,
    amountInput: values.amount > 0 ? String(values.amount) : "",
    categoryOption: values.categoryOption,
    customCategory: values.customCategory,
    description: values.description,
  };
}

function sanitizeAmountInput(value: string) {
  return value.replace(/\D/g, "");
}

export default function TransactionForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
  resetAfterSubmit = false,
}: TransactionFormProps) {
  const [formState, setFormState] = useState<FormState>(() =>
    createFormState(initialValues),
  );
  const [errors, setErrors] = useState<TransactionFormErrors>({});

  const amountValue = useMemo(
    () => Number(formState.amountInput || "0"),
    [formState.amountInput],
  );

  function updateField<Key extends keyof FormState>(
    key: Key,
    value: FormState[Key],
  ) {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function adjustAmount(delta: number) {
    const nextAmount = Math.max(0, amountValue + delta);
    updateField("amountInput", nextAmount === 0 ? "" : String(nextAmount));
    setErrors((current) => ({
      ...current,
      amount: undefined,
    }));
  }

  function handleQuickAmount(amount: number) {
    const nextAmount = amountValue + amount;
    updateField("amountInput", String(nextAmount));
    setErrors((current) => ({
      ...current,
      amount: undefined,
    }));
  }

  function validateForm() {
    const nextErrors: TransactionFormErrors = {};

    if (!formState.date) {
      nextErrors.date = "The transaction date must be entered.";
    }

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      nextErrors.amount = "The amount must be greater than 0.";
    }

    if (!formState.categoryOption) {
      nextErrors.category = "A category must be selected.";
    } else if (
      formState.categoryOption === CUSTOM_CATEGORY_OPTION &&
      !formState.customCategory.trim()
    ) {
      nextErrors.category = "Fill in the Other Category field when selecting Other.";
    }
    if (!formState.description) {
      nextErrors.description = "The description field must be filled in.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit({
      date: formState.date,
      type: formState.type,
      amount: amountValue,
      categoryOption: formState.categoryOption,
      customCategory: formState.customCategory,
      description: formState.description,
    });

    if (resetAfterSubmit) {
      setFormState(createFormState());
      setErrors({});
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-6 md:grid-cols-2">
        <label className="space-y-3">
          <span className="text-sm font-bold uppercase tracking-[0.25em] text-slate-700">
            Transaction date
          </span>
          <input
            type="date"
            value={formState.date}
            onChange={(event) => {
              updateField("date", event.target.value);
              setErrors((current) => ({
                ...current,
                date: undefined,
              }));
            }}
            className="w-full border border-black bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:bg-yellow-50"
          />
          {errors.date ? (
            <p className="text-sm text-red-700">{errors.date}</p>
          ) : (
            <p className="text-sm text-slate-500">
              The transaction date does not have to match the time of entry.
            </p>
          )}
        </label>

        <fieldset className="space-y-3">
          <legend className="text-sm font-bold uppercase tracking-[0.25em] text-slate-700">
          Transaction type
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-3 border border-black bg-white px-4 py-3 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50">
              <input
                type="radio"
                name="transaction-type"
                checked={formState.type === "Income"}
                onChange={() => updateField("type", "Income")}
                className="h-4 w-4 accent-slate-900"
              />
              <span>Income</span>
            </label>

            <label className="flex cursor-pointer items-center gap-3 border border-black bg-white px-4 py-3 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50">
              <input
                type="radio"
                name="transaction-type"
                checked={formState.type === "Expense"}
                onChange={() => updateField("type", "Expense")}
                className="h-4 w-4 accent-slate-900"
              />
              <span>Expense</span>
            </label>
          </div>
        </fieldset>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-slate-700">
              Amount
            </p>
          </div>
          <p className="text-sm font-medium text-slate-700">
            Preview: {formatCurrency(amountValue)}
          </p>
        </div>

        <div className="flex items-stretch gap-2">
          <button
            type="button"
            onClick={() => adjustAmount(-AMOUNT_STEP)}
            className="border border-black bg-white px-4 py-3 text-lg font-bold text-slate-900 transition-colors hover:bg-slate-100"
            aria-label="Decrease amount"
          >
            -
          </button>

          <input
            type="text"
            inputMode="numeric"
            value={formState.amountInput}
            onChange={(event) => {
              updateField("amountInput", sanitizeAmountInput(event.target.value));
              setErrors((current) => ({
                ...current,
                amount: undefined,
              }));
            }}
            placeholder="Example: 50000"
            className="min-w-0 flex-1 border border-black bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:bg-yellow-50"
          />

          <button
            type="button"
            onClick={() => adjustAmount(AMOUNT_STEP)}
            className="border border-black bg-yellow-300 px-4 py-3 text-lg font-bold text-slate-900 transition-colors hover:bg-yellow-200"
            aria-label="Increase amount"
          >
            +
          </button>
        </div>

        {errors.amount ? (
          <p className="text-sm text-red-700">{errors.amount}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNT_OPTIONS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => handleQuickAmount(amount)}
              className="border border-black bg-white px-3 py-2 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-100"
            >
              +{new Intl.NumberFormat("id-ID").format(amount)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="transaction-category"
            className="text-sm font-bold uppercase tracking-[0.25em] text-slate-700"
          >
            Category
          </label>
          <select
            id="transaction-category"
            value={formState.categoryOption}
            onChange={(event) => {
              updateField("categoryOption", event.target.value);
              setErrors((current) => ({
                ...current,
                category: undefined,
              }));
            }}
            className="w-full border border-black bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:bg-yellow-50"
          >
            {TRANSACTION_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
            <option value={CUSTOM_CATEGORY_OPTION}>Other</option>
          </select>
          {errors.category ? (
            <p className="text-sm text-red-700">{errors.category}</p>
          ) : (
            <p className="text-sm text-slate-500">
              Select a preset category or use the “Other” option.
            </p>
          )}
        </div>
        <label className="space-y-2">
          <span className="text-sm font-bold uppercase tracking-[0.25em] text-slate-700">
          Other Category
          </span>
          <input
            type="text"
            value={formState.customCategory}
            onChange={(event) => {
              updateField("customCategory", event.target.value);
              setErrors((current) => ({
                ...current,
                category: undefined,
              }));
            }}
            disabled={formState.categoryOption !== CUSTOM_CATEGORY_OPTION}
            placeholder="Fill in if you select “Other”"
            className="w-full border border-black bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:bg-yellow-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          />
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-bold uppercase tracking-[0.25em] text-slate-700">
        Description
        </span>
        <textarea
          rows={4}
          value={formState.description}
          onChange={(event) => updateField("description", event.target.value)}
          placeholder="Write a brief description of the transaction"
          className="w-full border border-black bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:bg-yellow-50"
        />
        <p className="text-sm text-red-700">{errors.description}</p>
      </label>

      <div className="flex flex-col-reverse gap-3 border-t border-dashed border-slate-300 pt-4 sm:flex-row sm:justify-end">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="border border-black bg-white px-4 py-3 text-sm font-bold uppercase text-slate-900 transition-colors hover:bg-slate-100"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          className="border border-black bg-yellow-300 px-4 py-3 text-sm font-bold uppercase text-slate-900 transition-colors hover:bg-yellow-200"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
