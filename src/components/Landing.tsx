import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair } from '@solana/web3.js';
import { FC, useCallback, useEffect, useState } from 'react';
import { notify } from "../utils/notifications";
import useUserSOLBalanceStore from '../stores/useUserSOLBalanceStore';
import idl from "./ts_sol.json";
import { Program, AnchorProvider, web3, utils, BN } from "@coral-xyz/anchor"

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
    }

    // SHould I put a function here that checks if the user has a VIP account on-chain?
    // If not the rather than the startKYC function, it should be a function that creates a VIP account on-chain
    const [isCheckingVIPAccount, setIsCheckingVIPAccount] = useState(true);
    const [hasVIPAccount, setHasVIPAccount] = useState(false);

    const checkVIPAccount = useCallback(async () => {
        if (!ourWallet?.publicKey) {
            console.log('error', 'Wallet not connected!');
            return;
        }

        const provider = getProvider();
        const program = new Program(idl_object, programID, provider);

        const [vipPda] = await PublicKey.findProgramAddressSync([
            utils.bytes.utf8.encode("vip"),
            provider.wallet.publicKey.toBuffer(),
        ], program.programId
        );

        const vipAccount = await program.account.vipAccount.fetch(vipPda);
        // If the fetch method does not throw an error, the account exists
        console.log("VIP Account: ", vipAccount);

    }, [ourWallet, connection, getUserSOLBalance]);

    useEffect(() => {
        if (ourWallet) {
            checkVIPAccount();
        }
    }, [ourWallet, checkVIPAccount]);


    // const createVIPAccount = useCallback(async () => {
    //     const provider = getProvider();
    //     const program = new Program(idl_object, programID, provider);

    //     try {
    //         const [vipPda] = await PublicKey.findProgramAddressSync([
    //             utils.bytes.utf8.encode("vip"),
    //             provider.wallet.publicKey.toBuffer(),
    //         ], program.programId
    //         );

    //         const tx = await program.methods.initialize().accounts({
    //             vip: vipPda,
    //             authority: provider.wallet.publicKey,
    //             systemProgram: web3.SystemProgram.programId,
    //         }).rpc();

    //         if (program.account.vipAccount) {
    //             const vipAccount = await program.account.vipAccount.fetch(vipPda);
    //             // If the account exists, set the state variable
    //             if (vipAccount) {
    //                 setHasVIPAccount(true);
    //             }
    //             console.log("VIP Account created: ", vipAccount);
    //         } else {
    //             console.log('vipAccount does not exist in the program');
    //         }
    //     } catch (error) {
    //         console.log(error);
    //         // If the account doesn't exist, set state to false
    //         setHasVIPAccount(false);
    //     } finally {
    //         setIsCheckingVIPAccount(false);
    //     }
    // }, [ourWallet, connection]);


    // const startKYC = useCallback(async () => {
    //     if (!ourWallet) {
    //         console.log('error', 'Wallet not connected!');
    //         notify({ type: 'error', message: 'error', description: 'Wallet not connected!' });
    //         return;
    //     }

    //     let payload = {
    //         reference: `TS_VIP_${ourWallet.publicKey.toBase58()}_${Math.random()}`,
    //         journey_id: "shMlbzzM1687780796",
    //         callback_url: "https://ts-vip.vercel.app/",
    //     }

    //     const btoa_string = process.env.NEXT_PUBLIC_SP_API_KEY + ":" + process.env.NEXT_PUBLIC_SP_API_SECRET;

    //     var token = btoa(btoa_string);

    //     try {
    //         const response = await fetch('https://api.shuftipro.com/', {
    //             method: 'post',
    //             headers: {
    //                 'Accept': 'application/json',
    //                 'Content-Type': 'application/json',
    //                 'Authorization': 'Basic ' + token
    //             },
    //             body: JSON.stringify(payload)
    //         });

    //         const data = await response.json();

    //         console.log("KYC RESPONSE: ", data);

    //         if (data.reference) {
    //             const kyc_ref = data.reference;
    //         }

    //         if (data.event && data.event === 'request.pending') {
    //             console.log("KYC REQUEST PENDING");
    //             window.open(data.verification_url, '_blank');

    //             //                window.location.href = data.verification_url; ADD THIS BACK IN AT FINAL STAGE
    //         } else {
    //             console.log("KYC REQUEST ERROR");
    //             console.log(data);
    //         }

    //     } catch (error) {
    //         console.error('Error starting KYC process:', error);
    //     }

    // }, [ourWallet, connection, getUserSOLBalance]);


    return (
        <div className="flex flex-row justify-center">
            <div className="relative group items-center">
                <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                    rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>

                {!isCheckingVIPAccount && (
                    hasVIPAccount ? (
                        <button
                            className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
//                            onClick={startKYC}
                        >
                            <span>KYC Placeholder </span> // allow onClick above to restart KYC process
                        </button>
                    ) : (
                        <button
                            className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
//                            onClick={createVIPAccount}
                        >
                            <span>Account creation placeholder</span> // allow onClick above to create VIP account
                        </button>
                    )
                    
                )}
            </div>
        </div>
    );
};

