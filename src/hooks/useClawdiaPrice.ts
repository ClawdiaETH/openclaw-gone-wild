import { useQuery } from '@tanstack/react-query';

const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/token_price/base?contract_addresses=0xbbd9aDe16525acb4B336b6dAd3b9762901522B07&vs_currencies=usd';

export function useClawdiaPrice() {
  return useQuery(['clawdiaPrice'], async () => {
    const res = await fetch(COINGECKO_URL);
    const data = await res.json();
    const price = data['0xbbd9aDe16525acb4B336b6dAd3b9762901522B07']?.usd;
    return price ? Number(price) : null;
  }, { staleTime: 1000 * 60 * 5 }); // 5 min cache
}
