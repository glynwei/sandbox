import { qb, useImpression } from "../causal";

export default function RatingBox() {
  const { impression, loading } = useImpression(
    qb().getRatingBox({ product: "abc" })
  );
  return (
    <div>
      RatingBox feature flag is{" "}
      {loading
        ? "loading..."
        : impression.RatingBox == undefined
        ? "OFF"
        : "ON"}
    </div>
  );
}
