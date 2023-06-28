import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair } from '@solana/web3.js';
import { FC, useCallback, useEffect, useState } from 'react';
// import { notify } from "../utils/notifications";
import useUserSOLBalanceStore from '../stores/useUserSOLBalanceStore';
import idl from "./ts_sol.json";
import { Program, AnchorProvider, web3, utils, BN } from "@coral-xyz/anchor"
import { notify } from 'utils/notifications';
import { set } from 'date-fns';

const idl_string = JSON.stringify(idl);
const idl_object = JSON.parse(idl_string);

const programID = new PublicKey(idl.metadata.address);

export const Landing: FC = () => {
    const { connection } = useConnection();
    const ourWallet = useWallet();
    const { getUserSOLBalance } = useUserSOLBalanceStore();

    const getProvider = () => {
        const provider = new AnchorProvider(connection, ourWallet, AnchorProvider.defaultOptions());
        return provider;
    };

    const checkforVIP = async () => {

        if (!ourWallet?.publicKey) {
            console.log('error', 'Wallet not connected!');
            return;
        }

        try {
            const provider = getProvider();
            const program = new Program(idl_object, programID, provider);
            const [vipPda] = await PublicKey.findProgramAddressSync([
                utils.bytes.utf8.encode("tvip"),
                provider.wallet.publicKey.toBuffer(),
            ], program.programId
            );

            const vipAccount = await program.provider.connection.getAccountInfo(vipPda);

            if (vipAccount) {
                console.log("VIP Account exists");

                const vipAccountData = await program.account.vip.fetch(vipPda);
                console.log("VIP Account Data: ", vipAccountData);

                return vipAccountData;

            } else {
                console.log("VIP Account does not exist");
            }

        } catch (error) {
            console.log(error);
        }
    };

    const [hasVIPAccount, setHasVIPAccount] = useState(false);
    const [vipAccountData, setVipAccountData] = useState(null);

    const checkVIPAccount = async () => {
        if (!ourWallet?.publicKey) {
            console.log('error', 'Wallet not connected!');
            return;
        }

        const provider = getProvider();
        const program = new Program(idl_object, programID, provider);
        try {
            const [vipPda] = await PublicKey.findProgramAddressSync([
                utils.bytes.utf8.encode("tvip"),
                provider.wallet.publicKey.toBuffer(),
            ], program.programId
            );

            const vipAccount = await program.account.vip.fetch(vipPda);
            if (vipAccount) {
                setHasVIPAccount(true);
                setVipAccountData(vipAccount);
            }
        } catch (error) {
            // If the fetch method throws an error, the account does not exist
            console.log('VIP account does not exist');
            setHasVIPAccount(false);
        }

    };


    useEffect(() => {
        if (ourWallet) {
            checkVIPAccount();
        }
    }, [ourWallet, checkVIPAccount]);

    const createVIPAccount = async () => {
        const provider = getProvider();
        const program = new Program(idl_object, programID, provider);

        try {
            const [vipPda] = await PublicKey.findProgramAddressSync([
                utils.bytes.utf8.encode("tvip"),
                provider.wallet.publicKey.toBuffer(),
            ], program.programId
            );

            const tx = await program.methods.initialize("mathlete").accounts({
                vip: vipPda,
                authority: provider.wallet.publicKey,
                systemProgram: web3.SystemProgram.programId,
            }).rpc();

            const latestBlockHash = await program.provider.connection.getLatestBlockhash();
            await program.provider.connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: tx
            });

            notify({ type: 'success', message: 'Account Created', description: tx });

            console.log("Account Created");

            setHasVIPAccount(true);
        } catch (error) {
            console.log(error);
            // If the account doesn't exist, set state to false
            setHasVIPAccount(false);
        }
    };


    //     const startKYC = useCallback(async () => {
    //         if (!ourWallet) {
    //             console.log('error', 'Wallet not connected!');

    //             return;
    //         }

    //         let payload = {
    //             reference: `TS_VIP_${ourWallet.publicKey.toBase58()}_${Math.random()}`,
    //             journey_id: "shMlbzzM1687780796",
    //             callback_url: "https://ts-vip.vercel.app/",
    //         }

    //         const btoa_string = process.env.NEXT_PUBLIC_SP_API_KEY + ":" + process.env.NEXT_PUBLIC_SP_API_SECRET;

    //         var token = btoa(btoa_string);

    //         try {
    //             const response = await fetch('https://api.shuftipro.com/', {
    //                 method: 'post',
    //                 headers: {
    //                     'Accept': 'application/json',
    //                     'Content-Type': 'application/json',
    //                     'Authorization': 'Basic ' + token
    //                 },
    //                 body: JSON.stringify(payload)
    //             });

    //             const data = await response.json();

    //             console.log("KYC RESPONSE: ", data);

    //             if (data.reference) {
    //                 const kyc_ref = data.reference;
    //             }

    //             if (data.event && data.event === 'request.pending') {
    //                 console.log("KYC REQUEST PENDING");
    //                 window.open(data.verification_url, '_blank');

    //                 //                window.location.href = data.verification_url; ADD THIS BACK IN AT FINAL STAGE
    //             } else {
    //                 console.log("KYC REQUEST ERROR");
    //                 console.log(data);
    //             }

    //         } catch (error) {
    //             console.error('Error starting KYC process:', error);
    //         }

    //     }, [ourWallet, connection, getUserSOLBalance]);

    return (

        <div className="flex flex-row justify-center">
            {hasVIPAccount ? (

                <div>
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-indigo-500 rounded-lg blur opacity-40 animate-tilt"></div>
                        <div className="max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-6 px-10 my-2">
                            <pre data-prefix=">">
                                <code className="truncate">{vipAccountData.username}</code>
                            </pre>
                        </div>
                    </div>
                    <p>User: {vipAccountData.user.toBase58()}</p>
                    <p>KYC Ref: {vipAccountData.reference}</p>
                    <p>Verified: {vipAccountData.verified ? "Yes" : "No"}</p>
                    <p>Votes: {vipAccountData.votes}</p>
                    <p>Member: {vipAccountData.member ? "Yes" : "No"}</p>
                    <p>NFT Will Appear Here</p>
                    <p>List of backers will apeear here</p>
                </div>
                // <button
                //     className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                //     onClick={checkforVIP}
                // >
                //     <span>Checks Again </span>
                // </button>
            ) : (
                <div className="relative group items-center">
                    <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                    rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>

                    <button
                        className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                        onClick={createVIPAccount}
                    >
                        <span>Create Account</span>
                    </button>
                </div>

            )}

            {/* {!isCheckingVIPAccount && (
                    hasVIPAccount ? (
                        <button
                            className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                            onClick={startKYC}
                        >
                            <span>KYC Verify </span>
                        </button>
                    ) : (
                        <button
                            className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                            onClick={createVIPAccount}
                        >
                            <span>Create VIP Account</span>
                        </button>
                    )
                )} */}
        </div>

    );
};

