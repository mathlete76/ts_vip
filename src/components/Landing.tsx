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
                utils.bytes.utf8.encode(init_string),
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
    const [vipAccountAddy, setVipAccountAddy] = useState(null);
    const [isKYCd, setKYCstatus] = useState(null);
    const [passedKYC, setPassedKYC] = useState(null);
    const [isAdmin, setAdmin] = useState(null);


    const checkVIPAccount = async () => {
        if (!ourWallet?.publicKey) {
            console.log('error', 'Wallet not connected!');
            return;
        }

        const provider = getProvider();
        const program = new Program(idl_object, programID, provider);
        try {
            const [vipPda] = await PublicKey.findProgramAddressSync([
                utils.bytes.utf8.encode(init_string),
                provider.wallet.publicKey.toBuffer(),
            ], program.programId
            );

            const vipAccount = await program.account.vip.fetch(vipPda);

            if (vipAccount) {
                setHasVIPAccount(true);
                setVipAccountData(vipAccount);
                setVipAccountAddy(vipPda);
            }

            if (vipAccountData && vipAccountData.verified) {
                setKYCstatus(true);
            } else if (vipAccountData && vipAccountData.reference != null) {
                setKYCstatus(true);
            } else {
                setKYCstatus(false);
            }

            if (ourWallet.publicKey.toBase58() == "87NmtJLRUxwKZf72QHoz8HgFVjPQrabUmCKeKHMAPWo2") {
                setAdmin(true);
            } else {
                setAdmin(false);
            }

            if (vipAccountData && vipAccountData.verified) {
                setPassedKYC(true);
            }


        } catch (error) {
            // If the fetch method throws an error, the account does not exist
            console.log(error);
            setHasVIPAccount(false);
        }
    };


    const checkShuftiStatus = async () => {
        if (!ourWallet?.publicKey) {
            console.log('error', 'Wallet not connected!');
            return;
        }
    
        let payload = {
            reference: vipAccountData.reference,
        }
    
        const btoa_string = process.env.NEXT_PUBLIC_SP_API_KEY + ":" + process.env.NEXT_PUBLIC_SP_API_SECRET;
    
        var token = btoa(btoa_string);
    
        const response = await fetch('https://api.shuftipro.com/status', {
            method: 'post',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + token
            },
            body: JSON.stringify(payload)
        });
    
        const data = await response.json();
    
        console.log("KYC RESPONSE: ", data);
    
        if (data.event && data.event === 'verification.accepted') {
            const provider = getProvider();
            const program = new Program(idl_object, programID, provider);
    
            const [vipPda] = await PublicKey.findProgramAddressSync([
                utils.bytes.utf8.encode(init_string),
                provider.wallet.publicKey.toBuffer(),
            ], program.programId
            );
    
            const tx = await program.methods.verify(true).accounts({
                vip: vipPda,
                authority: provider.wallet.publicKey,
                systemProgram: web3.SystemProgram.programId,
            }).rpc();
    
            const latestBlockHash = await program.provider.connection.getLatestBlockhash();
            const confirmation = await program.provider.connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: tx
            });
    
            notify({ type: 'success', message: 'KYC Accepted', description: tx });
    
            console.log("KYC ACCEPTED");
    
            setKYCstatus(true);
            setPassedKYC(true);
    
            if (!confirmation.value.err) {
                try {
                    const [membersPDA] = await PublicKey.findProgramAddressSync([
                        utils.bytes.utf8.encode("members_c"),
                    ], program.programId
                    );
    
                    const tx2 = await program.methods.addMember(ourWallet.publicKey.toBase58()).accounts({
                        members: membersPDA,
                        authority: provider.wallet.publicKey,
                        systemProgram: web3.SystemProgram.programId,
                    }).rpc();
    
                    const latestBlockHash2 = await program.provider.connection.getLatestBlockhash();
                    await program.provider.connection.confirmTransaction({
                        blockhash: latestBlockHash2.blockhash,
                        lastValidBlockHeight: latestBlockHash2.lastValidBlockHeight,
                        signature: tx2
                    });
    
                    notify({ type: 'success', message: 'Member List Updated', description: tx2 });
                } catch (error) {
                    notify({ type: 'error', message: 'Member List Update Failed', description: error });
                    console.log(error);
                };
            }
        };
    };
    


    useEffect(() => {
        if (ourWallet && !vipAccountData) {
            checkVIPAccount();
        }
    }, [ourWallet, checkVIPAccount]);

    useEffect(() => {
        // This function checks the KYC status
        const checkStatus = async () => {
            if (document.visibilityState === 'visible') {
                // Wait for 1 second before checking the KYC status
                setTimeout(async () => {
                    await checkVIPAccount();
                }, 3000);
            }
        };
    
        // Call the function once when the component mounts
        checkStatus();
    
        // Set up an event listener to call the function whenever the visibility state changes
        document.addEventListener('visibilitychange', checkStatus);
    
        // Clean up the event listener when the component unmounts
        return () => {
            document.removeEventListener('visibilitychange', checkStatus);
        };
    }, [checkVIPAccount]);
    
    

    const [userInput, setUserInput] = useState('');

    const createVIPAccount = async () => {
        if (!userInput || userInput.length > 64) {
            notify({ type: 'error', message: 'Invalid username', description: 'Username must be between 1 and 64 characters' });
            return;
        }
        const provider = getProvider();
        const program = new Program(idl_object, programID, provider);

        try {
            const [vipPda] = await PublicKey.findProgramAddressSync([
                utils.bytes.utf8.encode(init_string),
                provider.wallet.publicKey.toBuffer(),
            ], program.programId
            );

            const [founder] = await PublicKey.findProgramAddressSync([
                utils.bytes.utf8.encode("founders_wl_b"),
            ], program.programId
            );

            const tx = await program.methods.initialize(userInput).accounts({
                vip: vipPda,
                authority: provider.wallet.publicKey,
                founder: founder,
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


    const startKYC = async () => {
        if (!ourWallet) {
            console.log('error', 'Wallet not connected!');

            return;
        }

        let payload = {
            reference: `GF_BM_${ourWallet.publicKey.toBase58()}_${Math.random()}`,
            journey_id: "shMlbzzM1687780796",
            callback_url: "https://goodfellas.vercel.app/",
        }

        const btoa_string = process.env.NEXT_PUBLIC_SP_API_KEY + ":" + process.env.NEXT_PUBLIC_SP_API_SECRET;

        var token = btoa(btoa_string);

        try {
            const response = await fetch('https://api.shuftipro.com/', {
                method: 'post',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + token
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            console.log("KYC RESPONSE: ", data);

            if (data.event && data.event === 'request.pending') {
                const provider = getProvider();
                const program = new Program(idl_object, programID, provider);

                const [vipPda] = await PublicKey.findProgramAddressSync([
                    utils.bytes.utf8.encode(init_string),
                    provider.wallet.publicKey.toBuffer(),
                ], program.programId
                );

                const tx = await program.methods.setReference(data.reference).accounts({
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

                notify({ type: 'success', message: 'KYC Requested', description: tx });

                console.log("KYC REQUEST PENDING");

                window.location.href = data.verification_url;

            } else {
                console.log("KYC REQUEST ERROR");
                console.log(data);
            }

        } catch (error) {
            console.error('Error starting KYC process:', error);
        }

    };

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
                    <p>Account: {vipAccountAddy.toBase58()}</p>
                    <p>KYC Ref: {vipAccountData.reference}</p>
                    <p>Verified: {vipAccountData.verified ? "Yes" : "No"}</p>
                    <p>Goodfella: {vipAccountData.member ? "Yes" : "No"}</p>
                    {!passedKYC ? (
                        <div>
                            {isKYCd ? (
                                <div className="relative group items-center">
                                    <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                                                rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                                    <button
                                        className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                                        onClick={checkShuftiStatus}
                                    >
                                        <span>KYC to chain</span>
                                    </button>

                                </div>

                            ) : (
                                <div className="relative group items-center">
                                    <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                                                rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                                    <button
                                        className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                                        onClick={startKYC}
                                    >
                                        <span>KYC</span>
                                    </button>
                                </div>
                            )}
                            </div>) : (
                                    <span className="text-green-500">Verified</span>
                            )}
                </div>) : (
                    <div>
                <div className="relative group items-center">
                    <input
                        className="px-8 m-2 text-black"
                        placeholder="Username"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                    />
                </div>

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
                </div>
            )}
        </div>
    );
};
