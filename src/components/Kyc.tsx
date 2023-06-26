import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, TransactionSignature } from '@solana/web3.js';
import { FC, useCallback } from 'react';
import { notify } from "../utils/notifications";
import useUserSOLBalanceStore from '../stores/useUserSOLBalanceStore';

export const Kyc: FC = () => {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const { getUserSOLBalance } = useUserSOLBalanceStore();

    const DATABASE_URL = `postgresql://${process.env.PLANETSCALE_DB_USERNAME}:${process.env.PLANETSCALE_DB_PASSWORD}@${process.env.PLANETSCALE_DB_HOST}/${process.env.PLANETSCALE_DB}`;


    const startKYC = useCallback(async () => {
        if (!publicKey) {
            console.log('error', 'Wallet not connected!');
            notify({ type: 'error', message: 'error', description: 'Wallet not connected!' });
            return;
        }

        console.log(DATABASE_URL);

        let payload = {
            reference: `TS_VIP_${publicKey.toBase58()}_${Math.random()}`,
            journey_id: "shMlbzzM1687780796",
            callback_url: "https://ts-vip.vercel.app/",
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

            if (data.reference) {
                const kyc_ref = data.reference;
            }

            if (data.event && data.event === 'request.pending') {
                console.log("KYC REQUEST PENDING");
                window.open(data.verification_url, '_blank');
                
//                window.location.href = data.verification_url; ADD THIS BACK IN AT FINAL STAGE
            } else {
                console.log("KYC REQUEST ERROR");
                console.log(data);
            }

        } catch (error) {
            console.error('Error starting KYC process:', error);
        }

}, [publicKey, connection, getUserSOLBalance]);

    return (

        <div className="flex flex-row justify-center">
                <div className="relative group items-center">
                    <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                    rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            
                        <button
                            className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                            onClick={startKYC}
                            >
                                <span>KYC Verify </span>
                
                        </button>
                </div>
        </div>

        
    );
};

