import type { NextPage } from "next";
import Head from "next/head";
import { HomeView } from "../views";

const Home: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Goodfellas</title>
        <meta
          name="Goodfellas"
          content="Registeration, voting and NFTs"
        />
      </Head>
      <HomeView />
    </div>
  );
};

export default Home;
