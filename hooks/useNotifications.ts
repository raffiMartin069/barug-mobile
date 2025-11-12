import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/constants/supabase';

type Args = {
  userTypeId: 1 | 2;
  personId?: number | null;
  staffId?: number | null;
};

export type NotifItem = {
  notification_id: number;
  user_type_id: number;
  person_id: number | null;
  staff_id: number | null;
  title: string;
  body: string;
  deep_link: string | null;
  is_read: boolean;
  created_at: string;
};

export function useNotifications({ userTypeId, personId = null, staffId = null }: Args) {
  const [items, setItems] = useState<NotifItem[]>([]);
  const mine = (n: NotifItem) =>
    Number(n.user_type_id) === userTypeId &&
    ((userTypeId === 1 && Number(n.person_id || 0) === Number(personId || 0)) ||
     (userTypeId === 2 && Number(n.staff_id || 0) === Number(staffId || 0)));

  useEffect(() => {
    let mounted = true;

    async function load() {
      const q = supabase
        .from('notification')
        .select('*')
        .eq('user_type_id', userTypeId)
        .order('created_at', { ascending: false })
        .limit(50);

      const { data, error } = await q;
      if (!mounted) return;
      if (!error) {
        const mineOnly = (data || []).filter(mine) as NotifItem[];
        setItems(mineOnly);
      }
    }

    load();

    const channel = supabase
      .channel('notif-mobile')
      .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notification' },
          (payload) => {
            const n = payload.new as NotifItem;
            if (!mine(n)) return;
            setItems((prev) => [n, ...prev].slice(0, 50));
          })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [userTypeId, personId, staffId]);

  const unread = useMemo(() => items.filter((n) => !n.is_read).length, [items]);

  async function markAllRead() {
    // mark read via Supabase (if RLS allows) or call your Django endpoint
    const ids = items.filter(i => !i.is_read).map(i => i.notification_id);
    if (ids.length === 0) return;
    await supabase.from('notification').update({ is_read: true }).in('notification_id', ids);
    setItems(prev => prev.map(i => ({ ...i, is_read: true })));
  }

  return { items, unread, markAllRead };
}
