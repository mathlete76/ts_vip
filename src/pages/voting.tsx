import type { NextPage } from "next";
import Head from "next/head";
import { VotingView } from "views/voting";

const Voting: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Goodfellas</title>
        <meta
          name="Goodfellas"
          content="Registeration, voting and NFTs"
        />
      </Head>
      <VotingView />
    </div>
  );
};

export default Voting;
