import { useCallback, useState } from 'react';
import { SUPPORT_USER_ID } from '../../stream/config';
import { useStream } from '../../stream/StreamRoot';

/**
 * Opens (or creates) the member's support conversation: a DM between the member and the
 * `gateway-support` Stream user. Stream de-dupes DMs with the same member set, so this is idempotent.
 * Church staff answer by connecting to the Stream dashboard / a staff app as `gateway-support`.
 */
export function useOpenSupport(onOpen: (cid: string) => void) {
  const { chatClient, me } = useStream();
  const [opening, setOpening] = useState(false);

  const openSupport = useCallback(async () => {
    if (!chatClient || !me || opening) return;
    setOpening(true);
    try {
      const channel = chatClient.channel('messaging', {
        members: [me.id, SUPPORT_USER_ID],
        support: true,
      } as Record<string, unknown>);
      await channel.watch();
      if (channel.cid) onOpen(channel.cid);
    } finally {
      setOpening(false);
    }
  }, [chatClient, me, onOpen, opening]);

  return { openSupport, opening };
}
