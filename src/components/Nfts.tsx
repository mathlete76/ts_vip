import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair } from '@solana/web3.js';
import { FC, useCallback, useEffect, useState } from 'react';
import useUserSOLBalanceStore from '../stores/useUserSOLBalanceStore';
import idl from "./ts_sol.json";
import { Program, AnchorProvider, web3, utils, BN } from "@coral-xyz/anchor"
import { notify } from 'utils/notifications';
import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js";
import { createAssociatedTokenAccount } from '@solana/spl-token';

const idl_string = JSON.stringify(idl);
const idl_object = JSON.parse(idl_string);
const programID = new PublicKey(idl.metadata.address);

const creator = new PublicKey("DJMnZqNMtcydi2Sedu63VRkzDvFQtmMJgRgefPJu49Gt")



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

    // const getNFTs = async () => {
    //     const url = 'https://rpc.helius.xyz/?api-key=' + process.env.NEXT_PUBLIC_HEL_API_KEY;

    //     const response = await fetch(url, {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify({
    //             jsonrpc: '2.0',
    //             id: 'my-id',
    //             method: 'getAssetsByOwner',
    //             params: {
    //                 ownerAddress: creator.toBase58(),
    //                 page: 1, // Starts at 1
    //                 limit: 1000
    //             },
    //         }),
    //     });
    //     const { result } = await response.json();
    //     console.log("Assets by Owner: ", result);

    //     const nfts = await Promise.all(result.items.map(async (nft) => {
    //         const metadataResponse = await fetch(nft.content.json_uri);
    //         const metadata = await metadataResponse.json();
    //         return { ...nft, metadata };
    //     }));

    //     setNfts(nfts);

    //     console.log("NFTs: ", nfts);

    // }

    const getNFTs = async () => {

        const metaplex = new Metaplex(connection).use(walletAdapterIdentity(ourWallet));

        const result = await metaplex.nfts().findAllByOwner({ owner: creator });

        const nfts = await Promise.all(result.map(async (nft) => {
            const metadataResponse = await fetch(nft.uri);
            const metadata = await metadataResponse.json();
            return { ...nft, metadata };
        }));


        setNfts(nfts);

        console.log("NFTs: ", nfts);
    }

    useEffect(() => {
        if (ourWallet?.publicKey) {
            getNFTs();
        }
    }, [ourWallet]);


    const nftToVault = async (nft) => {
        if(!ourWallet?.publicKey) {
            console.log('error', 'Wallet not connected!');
            return;
        }

        console.log("NFT: ", nft.metadata.mintAddress.toBase58());
    };
        

    return (
        <div className="grid grid-cols-5 gap-4">
            {nfts && nfts
                .filter(nft => nft.metadata.name !== 'Goodfellas Collection')
                .map((nft, index) => (
                    <div key={index} className="relative group">
                        <div className="max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-6 px-10 my-2">
                            <img
                                src={nft.metadata.image}
                                alt={nft.metadata.name}
                                onClick={() => {
                                    setCurrentImage(nft.metadata.image);
                                    setIsModalOpen(true);
                                    nftToVault(nft);
                                }}
                            />
                            <pre data-prefix=">">
                                <code className="truncate">{nft.metadata.name}</code>
                            </pre>
                        </div>
                    </div>
                ))}
            {/* {isModalOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                    }}
                    onClick={() => setIsModalOpen(false)}
                >
                    <img src={currentImage} alt="" />
                </div>
            )} */}
        </div>
    );
};