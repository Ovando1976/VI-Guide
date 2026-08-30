import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { SocialCreateScreen } from "@/components/social/social-create-screen";

export const metadata = {
  title: "Create",
  description: "Create a post, community, group or event on Island Social.",
};

export default function SocialCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-[70vh] place-items-center bg-[#f5f8f7]">
          <Loader2 className="h-6 w-6 animate-spin text-teal-700" />
        </div>
      }
    >
      <SocialCreateScreen />
    </Suspense>
  );
}
