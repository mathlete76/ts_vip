import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair } from '@solana/web3.js';
import { FC, useCallback, useEffect, useState } from 'react';
import idl from "./ts_sol.json";
import { Program, AnchorProvider, web3, utils, BN } from "@coral-xyz/anchor"
import { notify } from 'utils/notifications';
import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js";
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
const init_string = "gf_a";

const creator = new PublicKey("DJMnZqNMtcydi2Sedu63VRkzDvFQtmMJgRgefPJu49Gt")

const mintKeyPair = web3.Keypair.generate();

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

    const mintNFT = async (nft) => {

        const uri = nft.uri;

        console.log("URI: ", uri);

        if (!ourWallet?.publicKey) {
            console.log('error', 'Wallet not connected!');
            return;
        }

        const provider = getProvider();
        const program = new Program(jdl_object, minterID, provider);

        const prog_x = new Program(idl_object, programID, provider);
        const [vipPda] = await PublicKey.findProgramAddressSync([
            utils.bytes.utf8.encode(init_string),
            provider.wallet.publicKey.toBuffer(),
        ], prog_x.programId
        );

        console.log("VIP PDA: ", vipPda.toBase58());


        const vipAccount = await prog_x.account.vip.fetch(vipPda) as any;

        setVipAccountData(vipAccount);

        if (vipAccount.nft) {
            notify({ message: "NFT Already Minted!", type: "error" });
            return;
        } else if (vipAccount.nft === null && vipAccount.verified === true && vipAccount.member === true) {

            const metadataAddress = (PublicKey.findProgramAddressSync(
                [
                    Buffer.from("metadata"),
                    TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                    mintKeyPair.publicKey.toBuffer(),
                ],
                TOKEN_METADATA_PROGRAM_ID
            ))[0];

            const sx = await program.methods.createToken(
                "GF Test", "GF", uri
            ).accounts({
                metadataAccount: metadataAddress,
                mintAccount: mintKeyPair.publicKey,
                mintAuthority: ourWallet.publicKey,
                payer: ourWallet.publicKey,
                rent: web3.SYSVAR_RENT_PUBKEY,
                systemProgram: web3.SystemProgram.programId,
                tokenProgram: utils.token.TOKEN_PROGRAM_ID,
                tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            }).signers([mintKeyPair]).rpc();

            console.log("NFT Ready!");
            console.log(`   Mint Address: ${mintKeyPair.publicKey}`);
            console.log(`   Tx Signature: ${sx}`);

            notify({ message: "NFT Ready to Mint!", type: "success" });

            const editionAddress = (web3.PublicKey.findProgramAddressSync(
                [
                    Buffer.from("metadata"),
                    TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                    mintKeyPair.publicKey.toBuffer(),
                    Buffer.from("edition"),
                ],
                TOKEN_METADATA_PROGRAM_ID
            ))[0];

            const associatedTokenAccountAddress = await utils.token.associatedAddress({
                mint: mintKeyPair.publicKey,
                owner: ourWallet.publicKey,
            });

            const sx2 = await program.methods.mintTo()
                .accounts({
                    associatedTokenAccount: associatedTokenAccountAddress,
                    editionAccount: editionAddress,
                    metadataAccount: metadataAddress,
                    mintAccount: mintKeyPair.publicKey,
                    mintAuthority: ourWallet.publicKey,
                    payer: ourWallet.publicKey,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    tokenProgram: utils.token.TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
                    tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
                })
                .signers([])
                .rpc();

            console.log("Success!");
            console.log(`   ATA Address: ${associatedTokenAccountAddress}`);
            console.log(`   Tx Signature: ${sx2}`);

            notify({ message: "NFT Minted!", type: "success" });

            const latestBlockHash = await program.provider.connection.getLatestBlockhash();
            const confirmation = await program.provider.connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: sx2
            });

            console.log("Before the setNFT call: ", vipPda.toBase58());

            const sx3 = await prog_x.methods.setNft(mintKeyPair.publicKey).accounts({
                vip: vipPda,
                payer: provider.wallet.publicKey,
                systemProgram: web3.SystemProgram.programId,
            }).rpc();

            const latestBlockHash2 = await program.provider.connection.getLatestBlockhash();
            const confirmation2 = await program.provider.connection.confirmTransaction({
                blockhash: latestBlockHash2.blockhash,
                lastValidBlockHeight: latestBlockHash2.lastValidBlockHeight,
                signature: sx3
            });

            const vipAccount = await prog_x.account.vip.fetch(vipPda);

            setVipAccountData(vipAccount);

            notify({ message: "NFT Recorded on chain!", type: "success" });


        } else {
            notify({ message: "Goodfellas only, scram!", type: "error" });
            return;
        }

    };

    return (
        <div>
            <div>
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

                                        <pre data-prefix=">">
                                        <code className='truncate'><button
                                        onClick={() => mintNFT(nft)}>Mint Goodfella</button></code>
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
        </div>
    );
};