import { BottomTabBar } from "./BottomTabBar";

interface AppShellProps {
  children: React.ReactNode;
  showFab?: boolean;
  onFabClick?: () => void;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomTabBar />
    </div>
  );
}
