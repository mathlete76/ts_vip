import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { FC, useEffect, useState } from 'react';
import { notify } from 'utils/notifications';
import { mintV2, mplCandyMachine, fetchCandyMachine } from "@metaplex-foundation/mpl-candy-machine";
import { setComputeUnitLimit } from "@metaplex-foundation/mpl-toolbox";
import { transactionBuilder, generateSigner, publicKey, some } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { PublicKey as pk } from '@solana/web3.js';
import idl from "./ts_sol.json";
import { Program, AnchorProvider, utils } from "@coral-xyz/anchor"

const idl_string = JSON.stringify(idl);
const idl_object = JSON.parse(idl_string);
const programID = new pk(idl.metadata.address);
const init_string = "gf_a";

const mainPrefix = "https://mainnet.helius-rpc.xyz/?api-key=";
const devPrefix = "https://rpc-devnet.helius.xyz/?api-key=";
//const rpc = devPrefix + process.env.NEXT_PUBLIC_HEL_API_KEY; // use on devnet
const rpc = mainPrefix + process.env.NEXT_PUBLIC_HEL_API_KEY; // use on mainnet

export const Nfts: FC = () => {
    const { connection } = useConnection();
    const wallet = useWallet();

    const getProvider = () => {
        const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
        return provider;
    };

    const [vipAccountData, setVipAccountData] = useState(null);

    useEffect(() => {
        if (wallet?.publicKey && !vipAccountData) {
            const provider = getProvider();
            const program = new Program(idl_object, programID, provider);

            const fetchVipAccount = async () => {
                const [vipPda] = await pk.findProgramAddressSync([
                    utils.bytes.utf8.encode(init_string),
                    wallet.publicKey.toBuffer(),
                ], program.programId
                );
                const vipAccount = await program.account.vip.fetch(vipPda);
                setVipAccountData(vipAccount);
            };

            fetchVipAccount();
        }
    }, [wallet, vipAccountData]);

    const mintNFT = async () => {

        if (!wallet?.publicKey) {
            notify({ type: 'Error', message: 'Wallet not connected!', description: 'Please connect wallet to continue.' });
            return;
        }

        const provider = getProvider();
        const program = new Program(idl_object, programID, provider);

        const [vipPda] = await pk.findProgramAddressSync([
            utils.bytes.utf8.encode(init_string),
            provider.wallet.publicKey.toBuffer(),
        ], program.programId
        );

        const vipAccount = await program.account.vip.fetch(vipPda) as any;

        setVipAccountData(vipAccount);

        if (vipAccount.verified === true && vipAccount.member === true) {

            notify({ message: 'Minting NFT', description: 'Please wait...' });

            const umi = createUmi(rpc)
                .use(walletAdapterIdentity(wallet))
                .use(mplCandyMachine());

            const candyMachinePublicKey = publicKey(process.env.NEXT_PUBLIC_CANDYMACHINE);
            const candyMachine = await fetchCandyMachine(umi, candyMachinePublicKey);
            const nftMint = generateSigner(umi);

            try {
                const mint = await transactionBuilder()
                    .add(setComputeUnitLimit(umi, { units: 1_000_000 }))
                    .add(
                        mintV2(umi, {
                            candyMachine: candyMachine.publicKey,
                            nftMint,
                            collectionMint: candyMachine.collectionMint,
                            collectionUpdateAuthority: candyMachine.authority,
                            candyGuard: candyMachine.mintAuthority,
                            mintArgs: {
                                mintLimit: some({ id: 2 }),
                            },
                        })
                    )
                    .sendAndConfirm(umi);

                console.log("Minted NFT: ", mint);

            } catch (e) {
                console.log(e);
                notify({ type: 'Error', message: 'Minting failed!', description: e.message });
            }
        }
        else {
            notify({ type: 'Error', message: 'Minting failed!', description: 'You are not a verified member.' });
        }
    };

    return (
        <div>
            {vipAccountData && vipAccountData.verified === true && vipAccountData.member === true  ? (
                <div className="relative group items-center">
                    <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                                                rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                    <button
                        className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                        onClick={() => mintNFT()}
                    >
                        <span>Goodfella Mint</span>
                    </button>

                </div>) : (
                <div className="relative group items-center">
                    <h1>
                        Goodfellas Only
                    </h1>
                </div>
            )}
        </div>
    );
};