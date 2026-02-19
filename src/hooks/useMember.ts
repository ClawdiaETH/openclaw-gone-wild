import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Member } from '@/types';

export function useMember(walletAddress: string | undefined) {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!walletAddress) return;
    setLoading(true);
    supabase
      .from<Member>('members')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()
      .then(({ data, error }) => {
        if (error) console.error('Member fetch error', error);
        setMember(data || null);
        setLoading(false);
      });
  }, [walletAddress]);

  return { member, loading };
}
