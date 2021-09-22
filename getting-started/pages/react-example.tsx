import { useRouter } from "next/router";
import { useState } from "react";
import {
  queryBuilder,
  Session,
  SessionContext,
  useImpression,
} from "../causal";
import { RatingWidget } from "../components/RatingWidget";
import { getOrGenDeviceId, products } from "../utils";

export default function Page() {
  const router = useRouter();

  const session = new Session({ deviceId: getOrGenDeviceId(router) });

  const product = products[router.query.pid as keyof typeof products];
  if (product == undefined) {
    return <></>; // Product not found
  }

  return (
    <SessionContext.Provider value={session}>
      <ProductInfo product={product} />
    </SessionContext.Provider>
  );
}

export function ProductInfo({
  product,
}: {
  product: { name: string; url: string; next: string };
}) {
  const [rating, setRating] = useState(0);
  const router = useRouter();

  const query = queryBuilder().getRatingBox({ product: product.name });
  const { impression, flags, error } = useImpression(query);

  // check for errors
  if (error) {
    console.log(
      "There is no impression server running yet, but it still works! " +
        "Causal is resilient to network and backend outages " +
        "because the defaults are compiled in 😃."
    );
  }

  return (
    <div className="center">
      <h1>{product.name}</h1>
      <img src={product.url} alt="product image" />

      {/* test feature flag */}
      {flags?.RatingBox && (
        <>
          {/* use impression data */}
          <h3>{impression.RatingBox?.callToAction}</h3>
          <RatingWidget
            curRating={rating}
            onSetRating={(newRating) => {
              setRating(newRating);
              // wire up events
              impression.RatingBox?.signalRating({ stars: newRating });
            }}
          />
          <a href={router.route + "?pid=" + product.next}>Rate Another</a>
        </>
      )}
    </div>
  );
}
