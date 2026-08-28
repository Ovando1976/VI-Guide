import { OperatorCanaryRunControl } from "./OperatorCanaryRunControl";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AgentCanaryLayout({ children }: { children: React.ReactNode }) {
  const preview = process.env.VERCEL_ENV === "preview";

  return (
    <>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-end px-4 sm:bottom-6 sm:px-6">
        <div className="pointer-events-auto">
          <OperatorCanaryRunControl preview={preview} />
        </div>
      </div>
    </>
  );
}
