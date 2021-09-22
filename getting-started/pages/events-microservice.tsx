import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import { qb, RatingBox, Session } from "../causal";
import { RatingWidget } from "../components/RatingWidget";
import { getOrGenDeviceId, products } from "../utils";

type SSRProps = {
  showRatingBox: boolean;
  product: typeof products[keyof typeof products];
  CTA: string;
};

export async function getServerSideProps(
  context: GetServerSidePropsContext
): Promise<{ props: SSRProps }> {
  const deviceId = getOrGenDeviceId(context);
  const product =
    products[context.query.pid as keyof typeof products] ?? products["iphone"];

  const session = new Session({ deviceId }, context.req);
  const { impression, flags, error } = await session.requestImpression(
    qb().getRatingBox({ product: product.name }),
    "imp-1234"
  );

  if (error) {
    console.log(
      "There is no impression server running yet, but it still works! " +
        "Causal is resilient to network and backend outages because the defaults are compiled in 😃."
    );
  }

  return {
    props: {
      showRatingBox: flags.RatingBox,
      product,
      CTA: impression.RatingBox?.callToAction ?? "",
    },
  };
}

export default function ProductInfo({ showRatingBox, product, CTA }: SSRProps) {
  const [rating, setRating] = useState(0);
  const router = useRouter();

  return (
    <div className="center">
      <h1>{product.name}</h1>
      <img src={product.url} alt="product image" />
      <h3>{CTA}</h3>

      {showRatingBox && (
        <>
          <RatingWidget
            curRating={rating}
            onSetRating={(newRating) => {
              setRating(newRating);
              RatingBox.signalRating(
                { deviceId: getOrGenDeviceId(router) },
                "imp-1234",
                {
                  stars: rating,
                }
              );

              // For autocomplete convenience, you can also reference the feature
              // classes through the allFeatureTypes variable.
              //
              // allFeatureTypes.RatingBox.signalRating(deviceId, impressionId, {
              //   stars: rating,
              // });
            }}
          />
          <a href={router.route + "?pid=" + product.next}>Rate Another</a>
        </>
      )}
    </div>
  );
}
