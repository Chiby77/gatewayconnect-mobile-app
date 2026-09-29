import React, { createContext, useContext, useEffect, useState } from 'react';
import { useClientConnectedUser, useFeedsClient } from '@stream-io/feeds-react-native-sdk';
import type { Feed } from '@stream-io/feeds-react-native-sdk';
import { CHURCH_FEED_IDS } from '../../stream/config';

interface OwnFeeds {
  ownFeed?: Feed; // where the member's own posts go
  ownTimeline?: Feed; // what the member reads (self + followed)
}
const Ctx = createContext<OwnFeeds>({});
export const useOwnFeeds = () => useContext(Ctx);

/**
 * Creates the member's `user` + `timeline` feeds once, watches them (real-time WebSocket updates),
 * self-follows so own posts appear on the timeline, and follows church leaders so a new member's
 * feed is never empty. All idempotent; safe to run on every app start.
 */
export function OwnFeedsProvider({ children }: { children: React.ReactNode }) {
  const client = useFeedsClient();
  const me = useClientConnectedUser();
  const [feeds, setFeeds] = useState<OwnFeeds>({});

  useEffect(() => {
    if (!client || !me) return;
    const ownFeed = client.feed('user', me.id);
    const ownTimeline = client.feed('timeline', me.id);
    let cancelled = false;

    (async () => {
      try {
        await Promise.all([ownFeed.getOrCreate({ watch: true }), ownTimeline.getOrCreate({ watch: true })]);
        const following = ownFeed.currentState.own_follows?.some(f => f.source_feed.feed === ownTimeline.feed);
        if (!following) await ownTimeline.follow(ownFeed.feed);
        for (const id of CHURCH_FEED_IDS) {
          if (id === me.id) continue;
          try {
            await ownTimeline.follow(`user:${id}`);
          } catch {
            /* leader has not opened the app yet - retried on next start */
          }
        }
        if (!cancelled) setFeeds({ ownFeed, ownTimeline });
      } catch (e) {
        console.warn('Feeds setup failed', e);
      }
    })();

    return () => {
      cancelled = true;
      setFeeds({});
    };
  }, [client, me?.id]);

  return <Ctx.Provider value={feeds}>{children}</Ctx.Provider>;
}
