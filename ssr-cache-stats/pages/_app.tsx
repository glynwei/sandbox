import { NextPageContext } from "next";
import type { AppContext, AppInitialProps, AppProps } from "next/app";
import App from "next/app";
import { useRouter } from "next/router";
import {
  qb,
  Session,
  SessionContext,
  SessionJSON,
  useSession,
} from "../causal";
import Feature2 from "../components/Feature2";
import "../styles/globals.css";
import { getOrMakeDeviceId } from "../utils";

type MyAppProps = AppProps & { sessionJson: SessionJSON };
type MyAppInitialProps = AppInitialProps & { sessionJson: SessionJSON };

function StatsLogger() {
  const session = useSession();
  const router = useRouter();

  // log out cache misses for SSR
  const logCacheMisses = typeof window == "undefined";
  if (logCacheMisses) {
    if (session == undefined) console.log("No session for Stats Logger");
    else {
      const impressionStats = session.getImpressionStats();
      if (impressionStats.cacheMisses.length > 0) {
        console.log(
          "WARNING!: The following features were not cached: " +
            JSON.stringify(impressionStats.cacheMisses) +
            `. Please make sure your page (route pathname = ${router.pathname}) ` +
            "is requesting them in getInitialProps"
        );
      }
      if (impressionStats.cacheNoOps.length > 0) {
        console.log(
          "WARNING!: The following features were spuriously cached: " +
            JSON.stringify(impressionStats.cacheNoOps) +
            `. Please make sure your page (route pathname = ${router.pathname}) ` +
            "is not needlessly requesting them in getInitialProps"
        );
      }
    }
  }
  return null;
}

function MyApp({ Component, pageProps, sessionJson }: MyAppProps) {
  const session = Session.fromJSON(sessionJson);
  session.clearImpressionStats();

  const result = (
    <SessionContext.Provider value={session}>
      <Feature2>
        <Component {...pageProps} />
      </Feature2>
      <StatsLogger />
    </SessionContext.Provider>
  );

  return result;
}

MyApp.getInitialProps = async (
  context: AppContext
): Promise<MyAppInitialProps> => {
  const deviceId = getOrMakeDeviceId(context.ctx);

  const session = Session.fromDeviceId(deviceId, context.ctx.req);
  await session.requestImpression(qb().getFeature2({ exampleArg: "123" }));

  const appProps = await App.getInitialProps({
    ...context,
    ctx: {
      ...context.ctx,
      session,
    } as NextPageContext & {
      session: Session;
    },
  });

  const ret = { ...appProps, sessionJson: session.toJSON() };
  return ret;
};

export default MyApp;
