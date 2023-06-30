import type { NextPage } from "next";
import Head from "next/head";
import { NftsView } from "views/nfts";


const Nfts: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Solana Scaffold</title>
        <meta
          name="description"
          content="Basic Functionality"
        />
      </Head>
      <NftsView />
    </div>
  );
};

export default Nfts;