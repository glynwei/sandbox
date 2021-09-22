import Cookies from "cookies";
import { IncomingMessage, ServerResponse } from "http";
import { NextRouter } from "next/router";
import { ReactNode, useEffect, useState } from "react";
import cookie from "react-cookies";
import { v4 as uuidv4 } from "uuid";

type SSRContext = {
  req: IncomingMessage;
  res: ServerResponse;
};

/**
 * Get the device id stored in cookies. If not found, generate one and store it in cookies.
 *
 * @param routerOrContext
 * For SSR, the request context object, other wise a NextRouter
 * The router is needed to determine if Next.js is doing a static prerender, in which case the impresion is ignored
 *
 * @returns the found or generated device id
 */
export function getOrGenDeviceId(
  routerOrContext: NextRouter | SSRContext
): string {
  const router: NextRouter | undefined =
    "req" in routerOrContext ? undefined : (routerOrContext as NextRouter);

  const context: SSRContext | undefined =
    "req" in routerOrContext ? (routerOrContext as SSRContext) : undefined;

  if (context) {
    const cookies = new Cookies(context.req, context.res);
    const deviceId = cookies.get("deviceId");
    if (deviceId !== undefined) {
      return deviceId;
    }

    const id = uuidv4();
    const date = new Date();
    date.setFullYear(2050);
    cookies.set("deviceId", id, { expires: date, httpOnly: false });
    return id;
  } else {
    if (typeof window == "undefined") {
      if (router && router.isReady) {
        console.error("SSR, but no context passed in");
        return "error-id";
      } else {
        // this is next.js doing a static prerender
        return "ignore-static-prerender-id";
      }
    }
    const device = cookie.load("deviceId");
    if (device !== undefined) return device;

    const id = uuidv4();
    const date = new Date();
    date.setFullYear(2050);
    cookie.save("deviceId", id, { expires: date, httpOnly: false });
    return id;
  }
}

/**
 * A component that only renders child components on the client side
 */
export function ClientOnly({ children }: { children?: ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}

export const products = {
  iphone: { name: "iPhone 13", url: "/iphone13.webp", next: "pixel" },
  pixel: { name: "Pixel 5", url: "/pixel5.webp", next: "fold" },
  fold: {
    name: "Samsung Galaxy Fold",
    url: "/galaxyfold.webp",
    next: "iphone",
  },
};
