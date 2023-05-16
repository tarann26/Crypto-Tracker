
import { useState, useCallback } from 'react';
import { Connection, PublicKey, ConfirmedSignatureInfo, ParsedTransactionWithMeta } from '@solana/web3.js';

export interface TransactionPattern {
  wallet: string;
  timestamp: number;
  type: 'buy' | 'sell' | 'transfer';
  token: string;
  amount: number;
  signature: string;
}

export interface WalletCorrelation {
  wallet1: string;
  wallet2: string;
  correlation: number;
  leadLagSeconds: number;
  confidence: number;
}

export const useTransactionAnalysis = (connection: Connection | null) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [transactionPatterns, setTransactionPatterns] = useState<TransactionPattern[]>([]);
  const [walletCorrelations, setWalletCorrelations] = useState<WalletCorrelation[]>([]);

  const fetchWalletHistory = useCallback(async (walletAddress: string, limit: number = 100) => {
    if (!connection) return [];

    try {
      const publicKey = new PublicKey(walletAddress);
      const signatures = await connection.getSignaturesForAddress(publicKey, { limit });
      
      const transactions: TransactionPattern[] = [];
      
      for (let i = 0; i < signatures.length; i++) {
        const signature = signatures[i];
        setAnalysisProgress((i / signatures.length) * 50); // First 50% of progress
        
        try {
          const transaction = await connection.getParsedTransaction(signature.signature);
          if (transaction && transaction.blockTime) {
            const pattern = parseTransactionForPattern(transaction, walletAddress);
            if (pattern) {
              transactions.push(pattern);
            }
          }
        } catch (error) {
          console.log(`Skipping transaction ${signature.signature}:`, error);
        }
      }
      
      return transactions;
    } catch (error) {
      console.error('Error fetching wallet history:', error);
      return [];
    }
  }, [connection]);

  const parseTransactionForPattern = (
    transaction: ParsedTransactionWithMeta,
    walletAddress: string
  ): TransactionPattern | null => {
    try {
      const { blockTime, transaction: txn } = transaction;
      if (!blockTime || !txn.message.instructions) return null;

      for (const instruction of txn.message.instructions) {
        if ('parsed' in instruction && instruction.parsed) {
          const parsed = instruction.parsed;

          if (parsed.type === 'transfer' && parsed.info) {
            return {
              wallet: walletAddress,
              timestamp: blockTime * 1000,
              type: 'transfer',
              token: parsed.info.mint || 'SOL',
              amount: parsed.info.amount || 0,
              signature: transaction.transaction.signatures[0]
            };
          }
          
          if (parsed.type === 'swap' || parsed.type === 'buy' || parsed.type === 'sell') {
            return {
              wallet: walletAddress,
              timestamp: blockTime * 1000,
              type: parsed.type as 'buy' | 'sell',
              token: parsed.info?.mint || 'SOL',
              amount: parsed.info?.amount || 0,
              signature: transaction.transaction.signatures[0]
            };
          }
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  };

  const calculateCorrelations = useCallback((patterns: TransactionPattern[]) => {
    const correlations: WalletCorrelation[] = [];
    const walletGroups = patterns.reduce((acc, pattern) => {
      if (!acc[pattern.wallet]) acc[pattern.wallet] = [];
      acc[pattern.wallet].push(pattern);
      return acc;
    }, {} as Record<string, TransactionPattern[]>);

    const wallets = Object.keys(walletGroups);
    
    for (let i = 0; i < wallets.length; i++) {
      for (let j = i + 1; j < wallets.length; j++) {
        const wallet1 = wallets[i];
        const wallet2 = wallets[j];
        const correlation = calculateWalletCorrelation(walletGroups[wallet1], walletGroups[wallet2]);
        
        if (correlation.correlation > 0.3) { // Only keep significant correlations
          correlations.push({
            wallet1,
            wallet2,
            ...correlation
          });
        }
      }
    }
    
    return correlations.sort((a, b) => b.correlation - a.correlation);
  }, []);

  const calculateWalletCorrelation = (
    patterns1: TransactionPattern[],
    patterns2: TransactionPattern[]
  ): Omit<WalletCorrelation, 'wallet1' | 'wallet2'> => {
    let correlation = 0;
    let leadLagSeconds = 0;
    let matches = 0;
    
    // Group by token for better correlation analysis
    const tokenGroups1 = patterns1.reduce((acc, p) => {
      if (!acc[p.token]) acc[p.token] = [];
      acc[p.token].push(p);
      return acc;
    }, {} as Record<string, TransactionPattern[]>);
    
    const tokenGroups2 = patterns2.reduce((acc, p) => {
      if (!acc[p.token]) acc[p.token] = [];
      acc[p.token].push(p);
      return acc;
    }, {} as Record<string, TransactionPattern[]>);
    
    for (const token of Object.keys(tokenGroups1)) {
      if (tokenGroups2[token]) {
        const group1 = tokenGroups1[token].sort((a, b) => a.timestamp - b.timestamp);
        const group2 = tokenGroups2[token].sort((a, b) => a.timestamp - b.timestamp);
        
        // Look for patterns where wallet1 acts before wallet2
        for (const tx1 of group1) {
          for (const tx2 of group2) {
            const timeDiff = tx2.timestamp - tx1.timestamp;
            
            // If wallet2 acts 1 minute to 1 hour after wallet1
            if (timeDiff > 60000 && timeDiff < 3600000) {
              correlation += 1;
              leadLagSeconds += timeDiff / 1000;
              matches++;
            }
          }
        }
      }
    }
    
    return {
      correlation: matches > 0 ? correlation / Math.max(patterns1.length, patterns2.length) : 0,
      leadLagSeconds: matches > 0 ? leadLagSeconds / matches : 0,
      confidence: Math.min(matches / 10, 1) // Confidence based on number of matches
    };
  };

  const analyzeWalletPatterns = useCallback(async (walletAddresses: string[]) => {
    if (!connection || walletAddresses.length === 0) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    try {
      const allPatterns: TransactionPattern[] = [];
      
      for (let i = 0; i < walletAddresses.length; i++) {
        const wallet = walletAddresses[i];
        const patterns = await fetchWalletHistory(wallet);
        allPatterns.push(...patterns);
        setAnalysisProgress(((i + 1) / walletAddresses.length) * 50);
      }
      
      setTransactionPatterns(allPatterns);
      
      setAnalysisProgress(75);
      const correlations = calculateCorrelations(allPatterns);
      setWalletCorrelations(correlations);
      
      setAnalysisProgress(100);
      console.log(`✅ Analysis complete: ${allPatterns.length} patterns, ${correlations.length} correlations`);
      
    } catch (error) {
      console.error('Error analyzing wallet patterns:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [connection, fetchWalletHistory, calculateCorrelations]);

  return {
    isAnalyzing,
    analysisProgress,
    transactionPatterns,
    walletCorrelations,
    analyzeWalletPatterns
  };
};
