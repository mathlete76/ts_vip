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

const init_string = "gf_a";

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
    const [memberAccountData, setMemberAccountData] = useState(null);
    const [vipAccounts, setVipAccounts] = useState([]);

    useEffect(() => {
        if (retrieved && memberAccountData) {
            const provider = getProvider();
            const program = new Program(idl_object, programID, provider);

            const fetchVipAccounts = async () => {
                const accounts = await Promise.all(

                    memberAccountData.members.map(async (member) => {
                        const [vipPda] = await PublicKey.findProgramAddressSync([
                            utils.bytes.utf8.encode(init_string),
                            new PublicKey(member).toBuffer(),
                        ], program.programId
                        );
                        const vipAccount = await program.account.vip.fetch(vipPda);
                        return vipAccount;
                    })
                );
                setVipAccounts(accounts);
            };
            fetchVipAccounts();
        }
    }, [retrieved, memberAccountData]);

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

            if (membersAccount) {
                console.log("Member Account Exists");

                console.log("Member Account Data: ", membersAccount);

                setMemberAccountData(membersAccount);
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
        <div className="flex flex-col justify-center">
            {vipAccounts.length > 0 ? (
                vipAccounts.map((vipAccount, index) => (
                    <div key={index} className="relative group">
                        <div className="max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-6 px-10 my-2">
                        <pre data-prefix=">">
                                <code className="truncate">{vipAccount.username}</code>
                            </pre>
                            </div>
                    </div>
                ))
            ) : (
                <p>No members</p>
            )}
        </div>
    );
};