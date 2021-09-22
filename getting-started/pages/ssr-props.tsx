import { GetServerSidePropsContext } from "next";
import { useState } from "react";
import {
  createQuery,
  ImpressionJSON,
  SelectFeatures,
  Session,
  toImpression,
} from "../causal";
import { RatingWidget } from "../components/RatingWidget";
import { getOrGenDeviceId, products } from "../utils";

type FeaturesToQuery = SelectFeatures<"RatingBox">;

type SSRProps = {
  product: typeof products[keyof typeof products];
  json: ImpressionJSON<FeaturesToQuery>;
};

export async function getServerSideProps(
  context: GetServerSidePropsContext
): Promise<{ props: SSRProps }> {
  const product =
    products[context.query.pid as keyof typeof products] ?? products["iphone"];

  const query = createQuery<FeaturesToQuery>({
    RatingBox: { product: product.name },
  });

  const impressionId = "imp-1234";

  const session = new Session({ deviceId: getOrGenDeviceId(context) });
  const { impression, error } = await session.requestImpression(
    query,
    impressionId
  );

  if (error) {
    console.log(
      "There is no impression server running yet, but it still works! " +
        "Causal is resilient to network and backend outages because the defaults are compiled in 😃."
    );
  }

  const props: SSRProps = { product, json: impression.toJSON() };
  return { props };
}

export default function ProductInfo({ json, product }: SSRProps) {
  const [rating, setRating] = useState(0);

  const impression = toImpression(json);

  return (
    <div className="center">
      <h1>{product.name}</h1>
      <img src={product.url} alt="product image" />

      <h3>{impression.RatingBox?.callToAction}</h3>

      {impression.RatingBox && (
        <>
          <RatingWidget
            curRating={rating}
            onSetRating={(newRating) => {
              setRating(newRating);
              impression.RatingBox?.signalRating({ stars: rating });
            }}
          />
          <a href={"ssr-props?pid=" + product.next}>Rate Another</a>
        </>
      )}
    </div>
  );
}
