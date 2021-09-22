import { useRouter } from "next/router";
import React from "react";
import { ClientOnly, getOrGenDeviceId } from "../utils";

export default function Page() {
  return (
    <ClientOnly>
      <RegistrationPage />
    </ClientOnly>
  );
}

export function RegistrationPage() {
  const router = useRouter();

  // this makes sure that when someone updates something in the tools UI,
  // the client side caching is flushed.
  // not strictly necessary if you are only using server side APIs
  window.localStorage.setItem("_causal_registered", "true");

  // the "deviceId" is our persistent key
  const deviceId = getOrGenDeviceId(router);
  router.push(`https://tools.causallabs.io/QA?persistentId=${deviceId}`);

  return <></>;
}
