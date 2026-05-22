import { TooltipProvider } from "@/components/ui/tooltip";
import { PageTransition } from "@/components/app/page-transition";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <PageTransition>{children}</PageTransition>
    </TooltipProvider>
  );
}
