import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair } from '@solana/web3.js';
import { FC, useCallback, useEffect, useState } from 'react';
import useUserSOLBalanceStore from '../stores/useUserSOLBalanceStore';
import idl from "./ts_sol.json";
import { Program, AnchorProvider, web3, utils, BN } from "@coral-xyz/anchor"
import { notify } from 'utils/notifications';
import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js";

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



    const [nfts, setNfts] = useState(null);

    const getNFTs = async () => {
        const url = 'https://rpc.helius.xyz/?api-key=' + process.env.NEXT_PUBLIC_HEL_API_KEY;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'my-id',
                method: 'getAssetsByOwner',
                params: {
                    ownerAddress: ourWallet?.publicKey?.toBase58(),
                    page: 1, // Starts at 1
                    limit: 1000
                },
            }),
        });
        const { result } = await response.json();
        console.log("Assets by Owner: ", result);

        const nfts = await Promise.all(result.items.map(async (nft) => {
            const metadataResponse = await fetch(nft.content.json_uri);
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

    return (
        <div>
    {nfts && nfts.map((nft, index) => (
        <div key={index} className="relative group">
            <div>
                <img src={nft.metadata.image} alt={nft.metadata.name} />
            </div>
        </div>
    ))}
    </div>
    );
};