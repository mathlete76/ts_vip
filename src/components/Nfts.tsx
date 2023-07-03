import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair } from '@solana/web3.js';
import { FC, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import idl from "./ts_sol.json";
import { Program, AnchorProvider, web3, utils, BN } from "@coral-xyz/anchor"
import { notify } from 'utils/notifications';
import { mintV2, mplCandyMachine, fetchCandyMachine, fetchCandyGuard } from "@metaplex-foundation/mpl-candy-machine";
import { setComputeUnitLimit } from "@metaplex-foundation/mpl-toolbox";
import { transactionBuilder, generateSigner, publicKey, some } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';


import {
    PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID
} from '@metaplex-foundation/mpl-token-metadata';

import { ASSOCIATED_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token';



const idl_string = JSON.stringify(idl);
const idl_object = JSON.parse(idl_string);
const programID = new PublicKey(idl.metadata.address);
const init_string = "gf_a";


export const Nfts: FC = () => {
    const { connection } = useConnection();
    const ourWallet = useWallet();

    const getProvider = () => {
        const provider = new AnchorProvider(connection, ourWallet, AnchorProvider.defaultOptions());
        return provider;
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentImage, setCurrentImage] = useState(null);
    const [nfts, setNfts] = useState(null);
    const [rawNfts, setRawNfts] = useState(null);
    const [vipAccountData, setVipAccountData] = useState(null);

    // const getNFTs = async () => {

    //     const metaplex = new Metaplex(connection).use(walletAdapterIdentity(ourWallet));

    //     const result = await metaplex.nfts().findAllByOwner({ owner: creator });

    //     setRawNfts(result);

    //     const nfts = await Promise.all(result.map(async (nft) => {
    //         const metadataResponse = await fetch(nft.uri);
    //         const metadata = await metadataResponse.json();
    //         return { ...nft, metadata };
    //     }));

    //     setNfts(nfts);

    //     console.log("NFTs: ", nfts);
    //     console.log("Raw NFTs: ", result);
    // }

    // useEffect(() => {
    //     if (ourWallet?.publicKey) {
    //         getNFTs();
    //     }
    // }, [ourWallet]);

    const mintNFT = async () => {

        if (ourWallet?.publicKey) {

            notify({ message: "Will be minting Goodfella...", type: "info" });
        } else {
            notify({ message: "Goodfellas only, scram!", type: "error" });
            return;
        }

        const rpc = ""
        const umi = createUmi("https://api.devnet.solana.com")
            .use(walletAdapterIdentity(ourWallet))
            .use(mplCandyMachine());

        const candyMachinePublicKey = publicKey("CPSNzvpnYhPrPtaHAZSaCLWojD2CqPR6JQjH8M8d2mF6");

        const candyMachine = await fetchCandyMachine(umi, candyMachinePublicKey);

        const nftMint = generateSigner(umi);

        await transactionBuilder()
            .add(setComputeUnitLimit(umi, { units: 800_000 }))
            .add(
                mintV2(umi, {
                    candyMachine: candyMachine.publicKey,
                    nftMint,
                    collectionMint: candyMachine.collectionMint,
                    collectionUpdateAuthority: candyMachine.authority,
                    mintArgs: {
                        mintLimit: some({ id: 1 }),
                      },
                })
            )
            .sendAndConfirm(umi);

    };

    return (
        <div>
            <div className="relative group items-center">
                <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                                                rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                <button
                    className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={() => mintNFT()}
                >
                    <span>Dummy Mint</span>
                </button>

            </div>
        </div>
    );
};