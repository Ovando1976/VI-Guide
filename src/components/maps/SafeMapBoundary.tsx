// src/components/maps/SafeMapBoundary.tsx
import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export default class SafeMapBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Map crashed:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 grid place-items-center bg-[#020617] text-center text-white">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl">
            <p className="text-xl font-black">Map temporarily unavailable</p>
            <p className="mt-2 text-sm text-white/60">
              The page is still running. The map failed safely instead of blanking the app.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}