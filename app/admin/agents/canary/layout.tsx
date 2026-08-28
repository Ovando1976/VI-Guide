import RunCanaryButton from "./RunCanaryButton";

export default function AgentShadowCanaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[70] sm:bottom-6 sm:right-6">
        <RunCanaryButton />
      </div>
    </>
  );
}
