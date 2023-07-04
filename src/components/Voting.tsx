import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair } from '@solana/web3.js';
import { FC, useCallback, useEffect, useState } from 'react';
import useUserSOLBalanceStore from '../stores/useUserSOLBalanceStore';
import idl from "./ts_sol.json";
import { Program, AnchorProvider, web3, utils, BN } from "@coral-xyz/anchor"
import { notify } from 'utils/notifications';

const idl_string = JSON.stringify(idl);
const idl_object = JSON.parse(idl_string);

const init_string = "gf_a";

const programID = new PublicKey(idl.metadata.address);

export const Voting: FC = () => {
    const { connection } = useConnection();
    const ourWallet = useWallet();

    const getProvider = () => {
        const provider = new AnchorProvider(connection, ourWallet, AnchorProvider.defaultOptions());
        return provider;
    };

    const [retrieved, setRetrieved] = useState(false);
    const [memberAccountData, setMemberAccountData] = useState(null);
    const [vipAccounts, setVipAccounts] = useState([]);

    const fetchVipAccounts = useCallback(async () => {
        if (memberAccountData) {
            const provider = getProvider();
            const program = new Program(idl_object, programID, provider);
            const accounts = await Promise.all(
                memberAccountData.members.map(async (member) => {
                    try {
                        const [vipPda] = await PublicKey.findProgramAddressSync([
                            utils.bytes.utf8.encode(init_string),
                            new PublicKey(member).toBuffer(),
                        ], program.programId
                        );
                        const vipAccount = await program.account.vip.fetch(vipPda) as any;
                        // Check if the member field of the VIP account is false
                        if (!vipAccount.member) {
                            return vipAccount;
                        }
                    } catch (error) {
                        console.error(`Failed to fetch VIP account for member ${member}: ${error}`);
                    }
                    return null;
                })
            );
            // Filter out null values (VIP accounts that could not be fetched or have member field set to true)
            setVipAccounts(accounts.filter(account => account !== null));
        }
    }, [memberAccountData]);
    

    useEffect(() => {
        if (retrieved) {
            fetchVipAccounts();
        }
    }, [retrieved, fetchVipAccounts]);

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

            console.log("Members PDA: ", membersPda.toBase58());

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

    const castVote = async (recipient) => {
        if (!ourWallet?.publicKey) {
            console.log('error', 'Wallet not connected!');
            return;
        }

        try {
            const provider = getProvider();
            const program = new Program(idl_object, programID, provider);
            const [recipPda] = await PublicKey.findProgramAddressSync([
                utils.bytes.utf8.encode(init_string),
                recipient.toBuffer(),
            ], program.programId
            );

            console.log("Recipient PDA: ", recipPda.toBase58());

            const [voterPda] = await PublicKey.findProgramAddressSync([
                utils.bytes.utf8.encode(init_string),
                ourWallet.publicKey.toBuffer(),
            ], program.programId
            );

            console.log("Voter PDA: ", voterPda.toBase58());

            const tx = await program.methods.vote().accounts({
                vip: recipPda,
                voter: voterPda,
                authority: ourWallet.publicKey,
                systemProgram: web3.SystemProgram.programId,
            }).rpc();

            const latestBlockHash = await program.provider.connection.getLatestBlockhash();
            const confirmation = await program.provider.connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: tx
            });

            notify({ type: 'success', message: 'Vote cast!', description: tx});
            console.log("Confirmation: ", confirmation);

            fetchVipAccounts();

        } catch (error) {

            notify({ type: 'error', message: 'Error casting vote!', description: error.message });
            console.log(error);
        }
    };

    return (
        <div className="grid grid-cols-5 gap-4 justify-center">
            {vipAccounts.length > 0 ? (
                vipAccounts.map((vipAccount, index) => (
                    <div key={index} className="relative group">
                        <div className="max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-6 px-10 my-2">
                            <pre data-prefix=">">
                                <code className="truncate">{vipAccount.username}</code>
                            </pre>
                            <pre data-prefix=">">
                                <code className="truncate">Votes: {vipAccount.votes}</code>
                            </pre>
                            <button
                                className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                                onClick={() => castVote(vipAccount.user)}
                            >
                                <span>Vote</span>
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <p>No Prospective Goodfellas</p>
            )}
        </div>
    );

}