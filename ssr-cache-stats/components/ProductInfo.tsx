import { qb, useImpression } from "../causal";

export default function ProductInfo() {
  const { impression, loading } = useImpression(qb().getProductInfo());
  return (
    <div>
      ProductInfo feature flag is{" "}
      {loading
        ? "loading..."
        : impression.ProductInfo == undefined
        ? "OFF"
        : "ON"}
    </div>
  );
}
