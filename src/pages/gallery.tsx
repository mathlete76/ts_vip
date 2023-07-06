import type { NextPage } from "next";
import Head from "next/head";
import { GalleryView } from "views/gallery";


const Gallery: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Goodfellas</title>
        <meta
          name="Goodfellas"
          content="Registration, Voting and NFTs"
        />
      </Head>
      <GalleryView />
    </div>
  );
};

export default Gallery;