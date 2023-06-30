
import { Nfts } from "components/Nfts";
import { V } from "drizzle-orm/column.d-b7dc3bdb";
import { FC } from "react";


export const NftsView: FC = ({ }) => {

  return (
    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <div className='mt-6'>
        <h1 className="text-center text-5xl md:pl-12 font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4">
          Goodfellas
        </h1>
        </div>
        <div className="flex flex-col mt-2">
          <Nfts />
        </div>
      </div>
    </div>
  );
};