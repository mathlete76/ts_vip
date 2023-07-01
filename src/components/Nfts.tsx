import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair } from '@solana/web3.js';
import { FC, useCallback, useEffect, useState } from 'react';
import useUserSOLBalanceStore from '../stores/useUserSOLBalanceStore';
import idl from "./ts_sol.json";
import { Program, AnchorProvider, web3, utils, BN } from "@coral-xyz/anchor"
import { notify } from 'utils/notifications';
import { Metaplex, walletAdapterIdentity} from "@metaplex-foundation/js";

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

    const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(ourWallet));

    const [nfts, setNfts] = useState(null);

    const getNFTs = async () => {
        const nfts = await metaplex.nfts().findAllByCreator({creator})

        setNfts(nfts);

        console.log(nfts);
    }

    useEffect(() => {
        if (!ourWallet?.publicKey){
        getNFTs();
        }
    }, [ourWallet]);

    return (
        <div className="flex flex-col justify-center">
            Holder Space
        </div>
    );
};