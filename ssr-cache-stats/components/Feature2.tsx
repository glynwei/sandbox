import { ReactNode } from "react";
import { qb, useImpression } from "../causal";

export default function Feature2({ children }: { children: ReactNode }) {
  const { impression, loading } = useImpression(
    qb().getFeature2({ exampleArg: "123" })
  );
  return (
    <div>
      <div>
        Feature2 feature flag is{" "}
        {loading
          ? "loading..."
          : impression.Feature2 == undefined
          ? "OFF"
          : "ON"}
      </div>
      {children}
    </div>
  );
}
