import Cookies from "cookies";
import { IncomingMessage, ServerResponse } from "http";
import { v4 as uuidv4 } from "uuid";
import cookie from "react-cookies";

// if context is undefined assumes client side and use browser cookies
// otherwise assumes server side and pulls cookies out of the request object
export function getOrMakeDeviceId(context?: {
  req?: IncomingMessage;
  res?: ServerResponse;
}): string {
  if (context?.req && context?.res) {
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
      console.error("Server side but no context passed in");
    }
    const device = cookie.load("deviceId");
    if (device !== undefined) return device;

    const id = uuidv4();
    const date = new Date();
    date.setFullYear(2050);
    cookie.save("deviceId", id, { expires: date });
    return id;
  }
}
