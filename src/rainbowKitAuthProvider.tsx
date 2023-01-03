import {SiweMessage} from "siwe";

import type {AuthenticationStatus} from "@rainbow-me/rainbowkit";
import {createAuthenticationAdapter, RainbowKitAuthenticationProvider,} from "@rainbow-me/rainbowkit";

import type {ReactNode} from "react";
import React from "react";

export type UnconfigurableMessageOptions = {
  address: string;
  chainId: number;
  nonce: string;
};

export type ConfigurableMessageOptions = Partial<Omit<SiweMessage, keyof UnconfigurableMessageOptions>> & {
  [Key in keyof UnconfigurableMessageOptions]?: never;
};

interface RainbowKitSiweNextAuthProviderProps {
  enabled?: boolean;
  children: ReactNode;
  status: AuthenticationStatus;
}

export function RainbowKitAuthProvider(
  {
    children,
    enabled = true,
    status,
  }: RainbowKitSiweNextAuthProviderProps) {
  const [sessionStatus, setSessionStatus] =
    React.useState<AuthenticationStatus>(status ?? "loading");

  const adapter = React.useMemo(
    () =>
      createAuthenticationAdapter({
        getNonce: async () => {
          const response = await fetch("https://app.dmeet.org/api/siwe/nonce");
          const nonce = await response.text();
          return nonce
        },

        createMessage: ({nonce, address, chainId}) => {
          const defaultConfigurableOptions: ConfigurableMessageOptions = {
            domain: window.location.host,
            statement: "Sign in with Ethereum to the app.",
            uri: window.location.origin,
            version: "1",
          };

          const unconfigurableOptions: UnconfigurableMessageOptions = {
            address,
            chainId,
            nonce,
          };

          return new SiweMessage({
            ...defaultConfigurableOptions,
            ...unconfigurableOptions,
          });
        },

        getMessageBody: ({message}: { message: SiweMessage }) => {
          return message.prepareMessage();
        },

        verify: async ({message, signature}) => {
          const verifyRes = await fetch("https://app.dmeet.org/api/siwe/verify", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
              message: message.prepareMessage(),
              signature,
            }),
          });

          if (verifyRes?.ok) {
            localStorage.setItem('nonce', message.nonce);
            setSessionStatus("authenticated");
          } else {
            setSessionStatus("unauthenticated");
          }

          return verifyRes?.ok ?? false;
        },

        signOut: async () => {
          localStorage.removeItem('nonce');
        },
      }),
    []
  );

  return (
    <RainbowKitAuthenticationProvider
      adapter={adapter}
      status={sessionStatus}
    >
      {children}
    </RainbowKitAuthenticationProvider>
  );
}
