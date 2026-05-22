/**
 * One-import toast surface used by the whole app.
 *
 *   import { toast } from "@/lib/toast";
 *   toast.success("Workspace switched", { description: "Now viewing Acme Inc." });
 *
 * Wrapped so we can later swap providers (sonner → custom) without
 * touching call sites.
 */

import { toast as sonnerToast } from "sonner";

type ToastOptions = Parameters<typeof sonnerToast>[1];

export const toast = {
  message: (title: string, opts?: ToastOptions) => sonnerToast(title, opts),
  success: (title: string, opts?: ToastOptions) =>
    sonnerToast.success(title, opts),
  error: (title: string, opts?: ToastOptions) =>
    sonnerToast.error(title, opts),
  info: (title: string, opts?: ToastOptions) => sonnerToast.info(title, opts),
  warning: (title: string, opts?: ToastOptions) =>
    sonnerToast.warning(title, opts),
  loading: (title: string, opts?: ToastOptions) =>
    sonnerToast.loading(title, opts),
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
  /** Quick helper for fetch errors — pulls `.message` if available. */
  fromError: (err: unknown, fallback = "Something went wrong") => {
    const msg =
      err instanceof Error ? err.message : typeof err === "string" ? err : fallback;
    sonnerToast.error(fallback, { description: msg });
  },
};
