import React from 'react';
import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import App from './App';
import './src/sync/backgroundSync';

// SafeAreaProvider must wrap the whole tree once: every screen (chat, community, and the app's own
// AppHeader/TabBar) reads insets from it. Android SDK 57 always draws edge-to-edge, so anything
// using a manual `StatusBar.currentHeight` guess instead of these insets renders under the status bar.
function Root() {
  return (
    <SafeAreaProvider>
      <App />
    </SafeAreaProvider>
  );
}

registerRootComponent(Root);
