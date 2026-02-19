import { useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';
import { CLAWDIA_ADDRESS } from '@/lib/constants';
import { base } from 'wagmi/chains';

export function useClawdiaBalance(address: string | undefined) {
  const { data: balance, isError, isLoading } = useReadContract({
    address: CLAWDIA_ADDRESS as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: base.id,
  });
  return { balance, isError, isLoading };
}
