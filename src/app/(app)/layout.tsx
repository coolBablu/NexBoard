import { TooltipProvider } from "@/components/ui/tooltip";

// NOTE: PageTransition (Framer Motion fade/slide wrapper) was removed —
// it occasionally got stuck in its `exit` keyframe (opacity: 0 +
// translateY) during fast client-side navigations, leaving the entire
// page content invisible until a hard refresh. The animation savings
// weren't worth the navigation foot-gun.

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
  );
}
