import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Chat, OverlayProvider, WithComponents, useCreateChatClient } from 'stream-chat-expo';
import type { StreamChat } from 'stream-chat';
import { useCreateFeedsClient } from '@stream-io/feeds-react-native-sdk';
import type { FeedsClient } from '@stream-io/feeds-react-native-sdk';
import { MobileUser } from '../auth/authService';
import { Colors, Typography } from '../theme/colors';
import { subscribeToNetworkStatus } from '../network/networkStatus';
import { STREAM_API_KEY, isStreamConfigured } from './config';
import { fetchStreamIdentity, streamTokenProvider, StreamIdentity } from './auth';
import { streamTheme } from './theme';
import { streamOverrides } from './overrides';

export type StreamStatus = 'signed-out' | 'connecting' | 'ready' | 'error' | 'not-configured';

interface StreamState {
  status: StreamStatus;
  error?: string;
  retry: () => void;
  chatClient: StreamChat | null;
  feedsClient: FeedsClient | null;
  me: StreamIdentity['user'] | null;
  totalUnread: number;
}

const StreamStateContext = createContext<StreamState>({
  status: 'signed-out',
  retry: () => undefined,
  chatClient: null,
  feedsClient: null,
  me: null,
  totalUnread: 0,
});
export const useStream = () => useContext(StreamStateContext);

interface Props {
  profile: MobileUser | null;
  children: React.ReactNode;
}

/**
 * Mounts Stream Chat + Feeds ONCE, above the whole app shell (RULES: clients live at the root, never
 * in a screen). Identity and token come from the GatewayConnect API (Supabase session -> Stream token).
 * Signing out changes `profile.id`, which unmounts <Connected> and lets the SDK hooks disconnect.
 */
export function StreamRoot({ profile, children }: Props) {
  const [identity, setIdentity] = useState<StreamIdentity | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(a => a + 1), []);

  // A single blip (slow tower, dropped packet - common on the connections most members are on) used to
  // strand the user on a manual "Chat unavailable / Try again" screen. This retries quietly a couple of
  // times with backoff before showing an error, and retries again the moment the device is back online -
  // matching how `syncEngine` already treats connectivity elsewhere in the app.
  useEffect(() => {
    setIdentity(null);
    setError(undefined);
    if (!profile || !isStreamConfigured) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const attemptFetch = (retriesLeft: number, delayMs: number) => {
      fetchStreamIdentity()
        .then(id => !cancelled && setIdentity(id))
        .catch(e => {
          if (cancelled) return;
          if (retriesLeft > 0) {
            timer = setTimeout(() => attemptFetch(retriesLeft - 1, delayMs * 2), delayMs);
          } else {
            setError(e?.message ?? 'Chat is temporarily unavailable.');
          }
        });
    };
    attemptFetch(2, 1500); // 3 tries total: immediate, +1.5s, +3s

    const unsubscribeNetwork = subscribeToNetworkStatus(status => {
      if (status === 'online' && !cancelled) {
        setError(undefined);
        attemptFetch(2, 1500);
      }
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      unsubscribeNetwork();
    };
  }, [profile?.id, attempt]);

  const idle = useMemo<StreamState>(
    () => ({
      status: !profile ? 'signed-out' : !isStreamConfigured ? 'not-configured' : error ? 'error' : 'connecting',
      error,
      retry,
      chatClient: null,
      feedsClient: null,
      me: null,
      totalUnread: 0,
    }),
    [profile, error, retry],
  );

  if (!profile || !identity) {
    return <StreamStateContext.Provider value={idle}>{children}</StreamStateContext.Provider>;
  }
  return (
    <Connected identity={identity} retry={retry}>
      {children}
    </Connected>
  );
}

function Connected({ identity, retry, children }: { identity: StreamIdentity; retry: () => void; children: React.ReactNode }) {
  const chatClient = useCreateChatClient({
    apiKey: STREAM_API_KEY,
    tokenOrProvider: streamTokenProvider,
    userData: identity.user,
  });
  const feedsClient = useCreateFeedsClient({
    apiKey: STREAM_API_KEY,
    tokenOrProvider: streamTokenProvider,
    userData: identity.user,
  });
  const totalUnread = useTotalUnread(chatClient);

  const value = useMemo<StreamState>(
    () => ({
      status: chatClient ? 'ready' : 'connecting',
      retry,
      chatClient,
      feedsClient,
      me: identity.user,
      totalUnread,
    }),
    [chatClient, feedsClient, identity.user, retry, totalUnread],
  );

  if (!chatClient) {
    return (
      <StreamStateContext.Provider value={value}>
        <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator color={Colors.gold} />
          <Text style={{ fontFamily: Typography.fontRegular, color: Colors.textMuted, fontSize: 13 }}>Connecting…</Text>
        </View>
      </StreamStateContext.Provider>
    );
  }

  // OverlayProvider + Chat both receive the SAME theme object (overlays don't inherit from Chat).
  return (
    <StreamStateContext.Provider value={value}>
      <OverlayProvider value={{ style: streamTheme }}>
        <Chat client={chatClient} style={streamTheme} enableOfflineSupport>
          <WithComponents overrides={streamOverrides}>{children}</WithComponents>
        </Chat>
      </OverlayProvider>
    </StreamStateContext.Provider>
  );
}

/** Real-time unread total (badge on tab/header). Updates from Stream events - no polling. */
function useTotalUnread(client: StreamChat | null): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!client) return;
    const own = client.user as { total_unread_count?: number } | undefined;
    setCount(own?.total_unread_count ?? 0);
    const sub = client.on(event => {
      if (typeof event.total_unread_count === 'number') setCount(event.total_unread_count);
    });
    return () => sub.unsubscribe();
  }, [client]);
  return count;
}
