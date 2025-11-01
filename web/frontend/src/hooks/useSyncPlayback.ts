// ============================================
// useSyncPlayback Hook
// Sync audio playback between collaborators
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

type SyncMode = 'off' | 'host' | 'listener';

interface SyncState {
  mode: SyncMode;
  hostUserId: string | null;
  hostUsername: string | null;
  listenerCount: number;
}

interface SyncPlaybackEvent {
  type: 'play' | 'pause' | 'seek' | 'host_join' | 'host_leave';
  timestamp: number;
  userId: string;
  username?: string;
}

interface UseSyncPlaybackProps {
  trackId: string;
  currentUserId: string | null;
  currentUsername: string | null;
  onPlay: (timestamp: number) => void;
  onPause: (timestamp: number) => void;
  onSeek: (timestamp: number) => void;
}

export function useSyncPlayback({
  trackId,
  currentUserId,
  currentUsername,
  onPlay,
  onPause,
  onSeek,
}: UseSyncPlaybackProps) {
  const [syncState, setSyncState] = useState<SyncState>({
    mode: 'off',
    hostUserId: null,
    hostUsername: null,
    listenerCount: 0,
  });

  const channelRef = useRef<any>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================
  // Toggle Sync Mode
  // ============================================

  const toggleSync = useCallback(() => {
    if (!currentUserId) return;

    if (syncState.mode === 'off') {
      // Become host
      setSyncState({
        mode: 'host',
        hostUserId: currentUserId,
        hostUsername: currentUsername,
        listenerCount: 0,
      });

      // Broadcast host join
      channelRef.current?.send({
        type: 'broadcast',
        event: 'sync_event',
        payload: {
          type: 'host_join',
          userId: currentUserId,
          username: currentUsername,
          timestamp: Date.now(),
        } as SyncPlaybackEvent,
      });
    } else {
      // Leave sync (host or listener)
      if (syncState.mode === 'host') {
        // Broadcast host leave
        channelRef.current?.send({
          type: 'broadcast',
          event: 'sync_event',
          payload: {
            type: 'host_leave',
            userId: currentUserId,
            timestamp: Date.now(),
          } as SyncPlaybackEvent,
        });
      }

      setSyncState({
        mode: 'off',
        hostUserId: null,
        hostUsername: null,
        listenerCount: 0,
      });
    }
  }, [syncState.mode, currentUserId, currentUsername]);

  // ============================================
  // Join as Listener
  // ============================================

  const joinAsListener = useCallback(() => {
    if (!currentUserId || !syncState.hostUserId) return;

    setSyncState((prev) => ({
      ...prev,
      mode: 'listener',
    }));
  }, [currentUserId, syncState.hostUserId]);

  // ============================================
  // Broadcast Play/Pause/Seek (Host only)
  // ============================================

  const broadcastPlay = useCallback(
    (timestamp: number) => {
      if (syncState.mode !== 'host' || !currentUserId) return;

      channelRef.current?.send({
        type: 'broadcast',
        event: 'sync_event',
        payload: {
          type: 'play',
          timestamp,
          userId: currentUserId,
        } as SyncPlaybackEvent,
      });
    },
    [syncState.mode, currentUserId]
  );

  const broadcastPause = useCallback(
    (timestamp: number) => {
      if (syncState.mode !== 'host' || !currentUserId) return;

      channelRef.current?.send({
        type: 'broadcast',
        event: 'sync_event',
        payload: {
          type: 'pause',
          timestamp,
          userId: currentUserId,
        } as SyncPlaybackEvent,
      });
    },
    [syncState.mode, currentUserId]
  );

  const broadcastSeek = useCallback(
    (timestamp: number) => {
      if (syncState.mode !== 'host' || !currentUserId) return;

      channelRef.current?.send({
        type: 'broadcast',
        event: 'sync_event',
        payload: {
          type: 'seek',
          timestamp,
          userId: currentUserId,
        } as SyncPlaybackEvent,
      });
    },
    [syncState.mode, currentUserId]
  );

  // ============================================
  // Setup Realtime Channel
  // ============================================

  useEffect(() => {
    if (!trackId) return;

    const channelName = `sync-track-${trackId}`;

    const channel = supabase.channel(channelName);

    // Handle incoming sync events
    channel.on('broadcast', { event: 'sync_event' }, ({ payload }) => {
      const event = payload as SyncPlaybackEvent;

      // Ignore own events
      if (event.userId === currentUserId) return;

      console.log('🎵 Received sync event:', event);

      switch (event.type) {
        case 'host_join':
          // New host joined - automatically become listener if we're already host
          setSyncState((prev) => ({
            ...prev,
            mode: prev.mode === 'host' ? 'listener' : prev.mode,
            hostUserId: event.userId,
            hostUsername: event.username || 'Unknown',
          }));
          break;

        case 'host_leave':
          // Host left, reset
          setSyncState({
            mode: 'off',
            hostUserId: null,
            hostUsername: null,
            listenerCount: 0,
          });
          break;

        case 'play':
          // Host pressed play
          if (syncState.mode === 'listener') {
            onPlay(event.timestamp);
          }
          break;

        case 'pause':
          // Host pressed pause
          if (syncState.mode === 'listener') {
            onPause(event.timestamp);
          }
          break;

        case 'seek':
          // Host seeked
          if (syncState.mode === 'listener') {
            onSeek(event.timestamp);
          }
          break;
      }
    });

    // Subscribe to presence (optional: track online listeners)
    channel.subscribe((status) => {
      console.log('🎵 Sync channel status:', status);
    });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [trackId, currentUserId, syncState.mode, onPlay, onPause, onSeek]);

  return {
    syncState,
    toggleSync,
    joinAsListener,
    broadcastPlay,
    broadcastPause,
    broadcastSeek,
  };
}
