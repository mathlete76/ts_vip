
import { Voting } from "components/Voting";
import { FC } from "react";


export const VotingView: FC = ({ }) => {

  return (
    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <img
          className="mx-auto h-64 w-64 object-contain border-4 border-indigo-500 rounded-full shadow-lg"
          src="/gfbm.png"
          alt="logo"
        />
        <div className="flex flex-col mt-2">
          <Voting />
        </div>
      </div>
    </div>
  );
};