import { useWallet } from '@solana/wallet-adapter-react';
import { FC } from 'react';
import idl from "./ts_sol.json";
import { notify } from 'utils/notifications';
import { mintV2, mplCandyMachine, fetchCandyMachine } from "@metaplex-foundation/mpl-candy-machine";
import { setComputeUnitLimit } from "@metaplex-foundation/mpl-toolbox";
import { transactionBuilder, generateSigner, publicKey, some } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';

const idl_string = JSON.stringify(idl);
const idl_object = JSON.parse(idl_string);

export const Nfts: FC = () => {
    
    const wallet = useWallet();

    const mintNFT = async () => {

        notify({ message: 'Minting NFT', description: 'Please wait...' });

        const umi = createUmi("https://api.devnet.solana.com")
            .use(walletAdapterIdentity(wallet));

        const candyMachinePublicKey = publicKey("CPSNzvpnYhPrPtaHAZSaCLWojD2CqPR6JQjH8M8d2mF6");

        const candyMachine = await fetchCandyMachine(umi, candyMachinePublicKey);

        const nftMint = generateSigner(umi);

        await transactionBuilder()
            .add(setComputeUnitLimit(umi, { units: 800_000 }))
            .add(
                mintV2(umi, {
                    candyMachine: candyMachine.publicKey,
                    nftMint: nftMint,
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