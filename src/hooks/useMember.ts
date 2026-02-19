import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Member } from '@/types';

export function useMember(walletAddress: string | undefined) {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!walletAddress) { setMember(null); return; }
    setLoading(true);
    supabase
      .from('members')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single()
      .then(({ data, error }) => {
        if (error && error.code !== 'PGRST116') console.error('Member fetch error', error);
        setMember((data as Member) ?? null);
        setLoading(false);
      });
  }, [walletAddress]);

  return { member, loading };
}
