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



    const [nfts, setNfts] = useState([]);

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
        console.log("Assets by Owner: ", result.items);

        setNfts(result.items);

    }

    useEffect(() => {
        if (ourWallet?.publicKey) {
            getNFTs();
        }
    }, [ourWallet]);

    return (
        <div className="flex flex-col justify-center">
            {/* {nfts.map((nft) => (
                <div className="flex flex-col justify-center">
                    <div className="flex flex-row justify-center">
                        <h2>{nft.content.metadata.name}</h2>
                    </div>
                </div>
            ))} */}
        </div>
    );
};