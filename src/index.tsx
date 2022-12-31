import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {BrowserRouter} from "react-router-dom";
import {configureChains, createClient, WagmiConfig} from 'wagmi';
import {RainbowKitAuthProvider} from "./rainbowKitAuthProvider";
import {getDefaultWallets, RainbowKitProvider} from "@rainbow-me/rainbowkit";
import {infuraProvider} from 'wagmi/providers/infura'
import {publicProvider} from 'wagmi/providers/public';
import {polygon} from 'wagmi/chains';
import '@rainbow-me/rainbowkit/styles.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const {chains, provider, webSocketProvider} = configureChains(
  [
    polygon,
  ],
  [
    infuraProvider({apiKey: '47d2344cdbaa4c89a395fea69d452261'}),
    publicProvider(),
  ]
);

const {connectors} = getDefaultWallets({
  appName: 'dMeet',
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
  webSocketProvider,
});
root.render(
  // <React.StrictMode>
  <WagmiConfig client={wagmiClient}>
    <RainbowKitAuthProvider status={"unauthenticated"}>
      <RainbowKitProvider chains={chains}>
        <BrowserRouter>
          <App/>
        </BrowserRouter>
      </RainbowKitProvider>
    </RainbowKitAuthProvider>
  </WagmiConfig>

  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
