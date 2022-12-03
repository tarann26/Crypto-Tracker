
import { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey, AccountInfo, ParsedAccountData } from '@solana/web3.js';

export interface WalletActivity {
  wallet: string;
  timestamp: number;
  type: 'transfer' | 'swap' | 'token_change';
  amount?: number;
  token?: string;
  signature?: string;
  details: any;
}

export interface MonitoredWallet {
  address: string;
  label: string;
  isLeader: boolean;
  followerCount: number;
  lastActivity: number;
  totalTransactions: number;
}

export const useWalletMonitoring = (connection: Connection | null) => {
  const [monitoredWallets, setMonitoredWallets] = useState<MonitoredWallet[]>([]);
  const [realtimeActivity, setRealtimeActivity] = useState<WalletActivity[]>([]);
  const [subscriptions, setSubscriptions] = useState<Map<string, number>>(new Map());
  const [isMonitoring, setIsMonitoring] = useState(false);

  const addWalletToMonitor = useCallback(async (address: string, label: string, isLeader: boolean = false) => {
    if (!connection) {
      console.error('No Solana connection available');
      return;
    }

    try {
      const publicKey = new PublicKey(address);
      
      // Get initial account info
      const accountInfo = await connection.getAccountInfo(publicKey);
      
      const newWallet: MonitoredWallet = {
        address,
        label,
        isLeader,
        followerCount: 0,
        lastActivity: Date.now(),
        totalTransactions: 0
      };

      setMonitoredWallets(prev => {
        const exists = prev.find(w => w.address === address);
        if (exists) return prev;
        return [...prev, newWallet];
      });

      // Subscribe to account changes
      if (!subscriptions.has(address)) {
        const subscriptionId = connection.onAccountChange(
          publicKey,
          (accountInfo: AccountInfo<Buffer>, context) => {
            console.log(`🔔 Account change detected for ${label}:`, {
              address,
              lamports: accountInfo.lamports,
              slot: context.slot
            });

            const activity: WalletActivity = {
              wallet: address,
              timestamp: Date.now(),
              type: 'token_change',
              details: {
                lamports: accountInfo.lamports,
                slot: context.slot,
                owner: accountInfo.owner.toString()
              }
            };

            setRealtimeActivity(prev => [activity, ...prev.slice(0, 99)]); // Keep last 100 activities
          },
          'confirmed'
        );

        setSubscriptions(prev => new Map(prev.set(address, subscriptionId)));
        console.log(`✅ Monitoring started for wallet: ${label} (${address})`);
      }

    } catch (error) {
      console.error('Error adding wallet to monitor:', error);
    }
  }, [connection, subscriptions]);

  const removeWalletFromMonitor = useCallback(async (address: string) => {
    if (!connection) return;

    const subscriptionId = subscriptions.get(address);
    if (subscriptionId !== undefined) {
      await connection.removeAccountChangeListener(subscriptionId);
      setSubscriptions(prev => {
        const newMap = new Map(prev);
        newMap.delete(address);
        return newMap;
      });
    }

    setMonitoredWallets(prev => prev.filter(w => w.address !== address));
    console.log(`🔴 Stopped monitoring wallet: ${address}`);
  }, [connection, subscriptions]);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    console.log('🚀 Real-time wallet monitoring started');
  }, []);

  const stopMonitoring = useCallback(async () => {
    if (!connection) return;

    // Remove all subscriptions
    for (const [address, subscriptionId] of subscriptions.entries()) {
      await connection.removeAccountChangeListener(subscriptionId);
    }
    
    setSubscriptions(new Map());
    setIsMonitoring(false);
    console.log('🛑 Real-time wallet monitoring stopped');
  }, [connection, subscriptions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    monitoredWallets,
    realtimeActivity,
    isMonitoring,
    addWalletToMonitor,
    removeWalletFromMonitor,
    startMonitoring,
    stopMonitoring
  };
};
