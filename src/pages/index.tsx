import type { NextPage } from "next";
import Head from "next/head";
import { HomeView } from "../views";

const Home: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Solana Scaffold</title>
        <meta
          name="TS VIPs"
          content="Trader Skew VIPs"
        />
      </Head>
      <HomeView />
    </div>
  );
};

export default Home;
