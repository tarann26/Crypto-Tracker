
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { useState, useEffect, useCallback } from 'react';

export interface SolanaConfig {
  endpoint: string;
  commitment: 'processed' | 'confirmed' | 'finalized';
}

const RPC_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com',
  clusterApiUrl('mainnet-beta'),
  'https://rpc.ankr.com/solana',
  'https://solana.public-rpc.com'
];

export const useSolanaConnection = (config?: SolanaConfig) => {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentEndpointIndex, setCurrentEndpointIndex] = useState(0);

  const defaultConfig: SolanaConfig = {
    endpoint: RPC_ENDPOINTS[0],
    commitment: 'confirmed'
  };

  const finalConfig = { ...defaultConfig, ...config };

  const testConnection = async (endpoint: string): Promise<boolean> => {
    try {
      const testConn = new Connection(endpoint, finalConfig.commitment);
      await Promise.race([
        testConn.getVersion(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      return true;
    } catch (err) {
      console.log(`❌ Failed to connect to ${endpoint}:`, err);
      return false;
    }
  };

  const findWorkingEndpoint = async (): Promise<string | null> => {
    for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
      const endpoint = RPC_ENDPOINTS[i];
      console.log(`🔄 Testing RPC endpoint: ${endpoint}`);
      
      if (await testConnection(endpoint)) {
        setCurrentEndpointIndex(i);
        return endpoint;
      }
    }
    return null;
  };

  const connectToSolana = async (endpoint?: string) => {
    setError(null);
    setIsConnected(false);

    try {
      let workingEndpoint = endpoint;
      
      if (!workingEndpoint) {
        workingEndpoint = await findWorkingEndpoint();
      }

      if (!workingEndpoint) {
        throw new Error('No working RPC endpoints found');
      }

      const conn = new Connection(workingEndpoint, finalConfig.commitment);
      
      // Test the connection
      await conn.getVersion();
      
      setConnection(conn);
      setIsConnected(true);
      console.log('✅ Connected to Solana RPC:', workingEndpoint);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown connection error';
      setError(`Failed to connect: ${errorMessage}`);
      setIsConnected(false);
      console.error('❌ Solana connection failed:', err);
    }
  };

  useEffect(() => {
    connectToSolana(finalConfig.endpoint);
  }, [finalConfig.endpoint, finalConfig.commitment]);

  const switchEndpoint = useCallback((newEndpoint: string) => {
    connectToSolana(newEndpoint);
  }, []);

  const retryConnection = useCallback(() => {
    connectToSolana();
  }, []);

  const switchToNextEndpoint = useCallback(() => {
    const nextIndex = (currentEndpointIndex + 1) % RPC_ENDPOINTS.length;
    const nextEndpoint = RPC_ENDPOINTS[nextIndex];
    console.log(`🔄 Switching to next RPC endpoint: ${nextEndpoint}`);
    connectToSolana(nextEndpoint);
  }, [currentEndpointIndex]);

  return {
    connection,
    isConnected,
    error,
    switchEndpoint,
    retryConnection,
    switchToNextEndpoint,
    currentEndpoint: RPC_ENDPOINTS[currentEndpointIndex],
    availableEndpoints: RPC_ENDPOINTS,
    config: finalConfig
  };
};
