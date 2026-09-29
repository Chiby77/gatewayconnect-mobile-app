import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '../theme/colors';
import { ChatList } from './chat/ChatList';
import { ChatRoom } from './chat/ChatRoom';

/**
 * Replaces the old ChatScreen. List <-> Room navigation carries only a `cid` string (RULES: never pass
 * a Channel instance through navigation), so ChatRoom re-derives the Channel from the shared client.
 */
export function ChatFeatureScreen({ onBack }: { onBack: () => void }) {
  const [cid, setCid] = useState<string | null>(null);
  return (
    <View style={styles.root}>
      {cid ? <ChatRoom cid={cid} onBack={() => setCid(null)} /> : <ChatList onOpenChannel={setCid} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
});
