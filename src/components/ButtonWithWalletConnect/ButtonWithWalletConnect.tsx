import {Button} from "../Button/Button";
import React from "react";
import {ConnectButton} from '@rainbow-me/rainbowkit';

interface IProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
  needWallet?: boolean;
}

export const ButtonWithWalletConnect = ({onClick, text, disabled, needWallet}: IProps) => {
  const buttonLabel = text || 'Connect Wallet';

  const button = <Button
    onClick={onClick}
    text={buttonLabel}
    disabled={disabled}
  />

  if (!needWallet) {
    return button
  }

  return (
    <ConnectButton.Custom>
      {({
          account,
          chain,
          // openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        // TODO: on connect proceed call onClick?

        return (
          <>
            {(() => {
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    text={'Connect Wallet'}
                    disabled={disabled}
                  />
                );
              }

              if (chain.unsupported) {
                return (
                  <Button
                    onClick={openChainModal}
                    text={' Wrong network'}
                  />
                );
              }

              return (
                button
              );
            })()}
          </>
        );
      }}
    </ConnectButton.Custom>
  );
}