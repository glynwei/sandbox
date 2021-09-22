import type { NextPage, NextPageContext } from "next";
import Head from "next/head";
import Link from "next/link";
import { qb, Session } from "../causal";
import ProductInfo from "../components/ProductInfo";
import styles from "../styles/Home.module.css";

const Overfetch: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Overfetch Test</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Overfetch Test</h1>
        <div>
          <ProductInfo />
        </div>
        <div>
          <div>
            <h2>Reload Links</h2>
            <a href="/" data-test-id="reload-index">
              Index
            </a>
            <br />
            <a href="/overfetch" data-test-id="reload-overfetch">
              Overfetch
            </a>
            <br />
            <a href="/underfetch" data-test-id="reload-underfetch">
              Underfetch
            </a>
            <br />
          </div>
          <div>
            <h2>Next Links</h2>
            <Link href="/">
              <a data-test-id="next-index">Index</a>
            </Link>
            <br />
            <Link href="/overfetch">
              <a data-test-id="next-overfetch">Overfetch</a>
            </Link>
            <br />
            <Link href="/underfetch">
              <a data-test-id="next-underfetch">Underfetch</a>
            </Link>
          </div>
        </div>{" "}
      </main>

      <footer className={styles.footer}></footer>
    </div>
  );
};

Overfetch.getInitialProps = async (
  ctx: NextPageContext & { session: Session }
) => {
  const session = ctx.session;
  await session.requestImpression(
    qb().getProductInfo().getRatingBox({ product: "abc" })
  );
  return { otherData: "foo" };
};

export default Overfetch;
