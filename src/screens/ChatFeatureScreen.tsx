import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '../theme/colors';
import { ChatList } from './chat/ChatList';
import { ChatRoom } from './chat/ChatRoom';

interface Props {
  onBack: () => void;
  /** Set when another screen (e.g. "Message" on a profile) wants to jump straight into a room. */
  initialCid?: string | null;
  onConsumedInitialCid?: () => void;
}

/**
 * Replaces the old ChatScreen. List <-> Room navigation carries only a `cid` string (RULES: never pass
 * a Channel instance through navigation), so ChatRoom re-derives the Channel from the shared client.
 */
export function ChatFeatureScreen({ onBack, initialCid, onConsumedInitialCid }: Props) {
  const [cid, setCid] = useState<string | null>(initialCid ?? null);

  useEffect(() => {
    if (initialCid) {
      setCid(initialCid);
      onConsumedInitialCid?.();
    }
  }, [initialCid, onConsumedInitialCid]);

  return (
    <View style={styles.root}>
      {cid ? <ChatRoom cid={cid} onBack={() => setCid(null)} /> : <ChatList onOpenChannel={setCid} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
});
