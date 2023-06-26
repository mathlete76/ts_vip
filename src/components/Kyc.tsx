import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, TransactionSignature } from '@solana/web3.js';
import { FC, useCallback } from 'react';
import { notify } from "../utils/notifications";
import useUserSOLBalanceStore from '../stores/useUserSOLBalanceStore';
import { Pool } from 'pg';

export const Kyc: FC = () => {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const { getUserSOLBalance } = useUserSOLBalanceStore();

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      });

      const query = async (text, params) => {
        const start = Date.now();
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('executed query', { text, duration, rows: res.rowCount });
        return res;
      };

    const startKYC = useCallback(async () => {
        if (!publicKey) {
            console.log('error', 'Wallet not connected!');
            notify({ type: 'error', message: 'error', description: 'Wallet not connected!' });
            return;
        }

        const getKYCReferenceByPublicKey = async (publicKey) => {
            const res = await query('SELECT * FROM kyc_references WHERE public_key = $1', [publicKey]);
            return res.rows[0];
          };

        const kyc_ref = await getKYCReferenceByPublicKey(publicKey.toBase58());

        if (kyc_ref) {
            console.log("KYC REFERENCE: ", kyc_ref);
        }

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

