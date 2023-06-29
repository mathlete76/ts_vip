import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair } from '@solana/web3.js';
import { FC, useCallback, useEffect, useState } from 'react';
import useUserSOLBalanceStore from '../stores/useUserSOLBalanceStore';
import idl from "./ts_sol.json";
import { Program, AnchorProvider, web3, utils, BN } from "@coral-xyz/anchor"
import { notify } from 'utils/notifications';
import { set } from 'date-fns';
import { get } from 'http';

const idl_string = JSON.stringify(idl);
const idl_object = JSON.parse(idl_string);

const programID = new PublicKey(idl.metadata.address);

export const Voting: FC = () => {
    const { connection } = useConnection();
    const ourWallet = useWallet();
    const { getUserSOLBalance } = useUserSOLBalanceStore();

    const getProvider = () => {
        const provider = new AnchorProvider(connection, ourWallet, AnchorProvider.defaultOptions());
        return provider;
    };

    const [retrieved, setRetrieved] = useState(false);
    const [memberList, setMemberList] = useState(null);

    const getMemberList = async () => {

        if (!ourWallet?.publicKey) {
            console.log('error', 'Wallet not connected!');
            return;
        }

        try {
            const provider = getProvider();
            const program = new Program(idl_object, programID, provider);
            const [membersPda] = await PublicKey.findProgramAddressSync([
                utils.bytes.utf8.encode("members_b"),
            ], program.programId
            );

            const membersAccount = await program.account.members.fetch(membersPda);

            if (membersAccount != null) {
                console.log("Member Account Exists");

                console.log("Member Account Data: ", membersAccount);

                setMemberList(membersAccount);
                setRetrieved(true);

            } else {
                console.log("List Account does not exist");
            }

        } catch (error) {
            console.log(error);
        }
    };




    useEffect(() => {
        if (!retrieved) {
            getMemberList();
        }
    }, [ourWallet, getMemberList, retrieved]);

    return (

        <div className="flex flex-row justify-center">
            To Be Implemented
        </div>
    );
};
