import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair } from '@solana/web3.js';
import { FC, useCallback, useEffect, useState } from 'react';
import useUserSOLBalanceStore from '../stores/useUserSOLBalanceStore';
import idl from "./ts_sol.json";
import { Program, AnchorProvider, web3, utils, BN } from "@coral-xyz/anchor"
import { notify } from 'utils/notifications';
import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js";
import { createAssociatedTokenAccount, TOKEN_PROGRAM_ID, } from '@solana/spl-token';
import jdl from "./nft_minter.json";
import {
    PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID
} from '@metaplex-foundation/mpl-token-metadata';

import { ASSOCIATED_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token';

const jdl_string = JSON.stringify(jdl);
const jdl_object = JSON.parse(jdl_string);
const minterID = new PublicKey(jdl.metadata.address);

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
    const [rawNfts, setRawNfts] = useState(null);

    const getNFTs = async () => {

        const metaplex = new Metaplex(connection).use(walletAdapterIdentity(ourWallet));

        const result = await metaplex.nfts().findAllByOwner({ owner: creator });

        setRawNfts(result);

        const nfts = await Promise.all(result.map(async (nft) => {
            const metadataResponse = await fetch(nft.uri);
            const metadata = await metadataResponse.json();
            return { ...nft, metadata };
        }));

        setNfts(nfts);

        console.log("NFTs: ", nfts);
        console.log("Raw NFTs: ", result);
    }

    useEffect(() => {
        if (ourWallet?.publicKey) {
            getNFTs();
        }
    }, [ourWallet]);

    const mintNFT = async () => {

        if (!ourWallet?.publicKey) {
            console.log('error', 'Wallet not connected!');
            return;
        }

        const provider = getProvider();
        const program = new Program(jdl_object, minterID, provider);

        const metadataAddress = (PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                ourWallet.publicKey.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
        ))[0];

        const nftUri = "https://vzxpwzi5mngabkh6ycdk6i7j6wzywgymgkg7hrwu5wczksug6yua.arweave.net/rm77ZR1jTACo_sCGryPp9bOLGwwyjfPG1O2FlUqG9ig"

        const sx = await program.methods.createToken(
            "GF Test", "GF", nftUri
        ).accounts({
            metadataAccount: metadataAddress,
            mintAccount: ourWallet.publicKey,
            mintAuthority: ourWallet.publicKey,
            payer: ourWallet.publicKey,
            rent: web3.SYSVAR_RENT_PUBKEY,
            systemProgram: web3.SystemProgram.programId,
            tokenProgram: utils.token.TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        }).rpc();

        console.log("Success!");
        console.log(`   Mint Address: ${ourWallet.publicKey}`);
        console.log(`   Tx Signature: ${sx}`);
    };



    return (
        <div>
            {/* <div className="relative group items-center">
                <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                                                rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                <button
                    className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={mintNFT}
                >
                    <span>Create Goodfella</span>
                </button>

            </div> */}
            <div className="grid grid-cols-5 gap-4">
                {nfts && nfts
                    .filter(nft => nft.name !== 'Goodfellas Collection')
                    .map((nft, index) => (
                        <div key={index} className="relative group">
                            <div className="max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-6 px-10 my-2">
                                <img
                                src={nft.metadata.image}
                                alt={nft.metadata.name}
                                onClick={() => {
                                    setCurrentImage(nft.metadata.image);
                                    setIsModalOpen(true);
                                }}
                            />
                                <pre data-prefix=">">
                                    <code className="truncate">{nft.name}</code>
                                </pre>
                            </div>
                        </div>
                    ))}
                {isModalOpen && (
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
            )}
            </div>
        </div>
    );
};