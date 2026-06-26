import { Suspense } from "react";
import InvoicePage from "../component/page/InvoicePage";

function LoadingFallback() {
  return (
    <div className="flex h-64 items-center justify-center text-sm font-medium text-zinc-500">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-900 border-t-transparent"></div>
        <span>Loading invoice...</span>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <InvoicePage />
    </Suspense>
  );
}
