import type { NextPage } from "next";
import Head from "next/head";
import { NftsView } from "views/nfts";


const Nfts: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Goodfellas</title>
        <meta
          name="Goodfellas"
          content="Registration, Voting and NFTs"
        />
      </Head>
      <NftsView />
    </div>
  );
};

export default Nfts;