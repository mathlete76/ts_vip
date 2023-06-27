import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { FC, useCallback } from 'react';
import { notify } from "../utils/notifications";
import useUserSOLBalanceStore from '../stores/useUserSOLBalanceStore';

export const Verified: FC = () => {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const { getUserSOLBalance } = useUserSOLBalanceStore();

    const checkKYC = useCallback(async () => {
        if (!publicKey) {
            console.log('error', 'Wallet not connected!');
            notify({ type: 'error', message: 'error', description: 'Wallet not connected!' });
            return;
        }

        

        try {
            if (publicKey) {
            }
        } catch (error) {
            console.error('Error checking VIP status:', error);
        };


}, [publicKey, connection, getUserSOLBalance]);

    return (

        <div className="flex flex-row justify-center">
                <div className="relative group items-center">
                    <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                    rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            
                        <button
                            className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                            onClick={checkKYC}
                            >
                                <span>Check KYC </span>
                
                        </button>
                </div>
        </div>
    );
};

