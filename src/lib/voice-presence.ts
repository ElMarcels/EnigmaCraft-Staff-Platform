export interface VoiceParticipantState {
  userId: string;
  displayName: string;
  role: string;
  avatarColor: string;
  isMuted: boolean;
  isDeafened?: boolean;
  isSpeaking: boolean;
  lastSeen: number;
}

export interface VoiceSignalMessage {
  id: string;
  fromUserId: string;
  fromDisplayName?: string;
  toUserId: string;
  channelId: string;
  type: "offer" | "answer" | "candidate";
  data: any;
  createdAt: number;
}

interface VoiceStore {
  channels: Record<string, Record<string, VoiceParticipantState>>;
  signals: VoiceSignalMessage[];
}

const globalForVoice = globalThis as unknown as { __voiceStore?: VoiceStore };

if (!globalForVoice.__voiceStore) {
  globalForVoice.__voiceStore = {
    channels: {},
    signals: [],
  };
}

const store = globalForVoice.__voiceStore;

const PRUNE_THRESHOLD_MS = 12_000; // 12 seconds inactivity = disconnected
const SIGNAL_TTL_MS = 30_000; // 30 seconds signal retention

function pruneStale() {
  const now = Date.now();

  // Prune inactive participants
  for (const channelId of Object.keys(store.channels)) {
    const participants = store.channels[channelId];
    for (const userId of Object.keys(participants)) {
      if (now - participants[userId].lastSeen > PRUNE_THRESHOLD_MS) {
        delete participants[userId];
      }
    }
    if (Object.keys(participants).length === 0) {
      delete store.channels[channelId];
    }
  }

  // Prune expired signals
  store.signals = store.signals.filter((s) => now - s.createdAt < SIGNAL_TTL_MS);
}

export function registerVoiceParticipant(
  channelId: string,
  user: {
    userId: string;
    displayName: string;
    role: string;
    avatarColor?: string;
    isMuted?: boolean;
    isDeafened?: boolean;
    isSpeaking?: boolean;
  }
): VoiceParticipantState[] {
  // Enforce single voice channel per user across the whole platform
  for (const cId of Object.keys(store.channels)) {
    if (cId !== channelId && store.channels[cId]?.[user.userId]) {
      delete store.channels[cId][user.userId];
      if (Object.keys(store.channels[cId]).length === 0) {
        delete store.channels[cId];
      }
    }
  }

  if (!store.channels[channelId]) {
    store.channels[channelId] = {};
  }

  store.channels[channelId][user.userId] = {
    userId: user.userId,
    displayName: user.displayName,
    role: user.role,
    avatarColor: user.avatarColor || "#f43f5e",
    isMuted: user.isMuted ?? false,
    isDeafened: user.isDeafened ?? false,
    isSpeaking: user.isSpeaking ?? false,
    lastSeen: Date.now(),
  };

  return Object.values(store.channels[channelId]);
}

export function removeVoiceParticipant(channelId: string, userId: string) {
  if (store.channels[channelId]?.[userId]) {
    delete store.channels[channelId][userId];
    if (Object.keys(store.channels[channelId]).length === 0) {
      delete store.channels[channelId];
    }
  }
}

export function removeUserFromAllChannels(userId: string) {
  for (const channelId of Object.keys(store.channels)) {
    if (store.channels[channelId][userId]) {
      delete store.channels[channelId][userId];
      if (Object.keys(store.channels[channelId]).length === 0) {
        delete store.channels[channelId];
      }
    }
  }
}

export function getChannelVoicePresence(channelId: string): VoiceParticipantState[] {
  pruneStale();
  return store.channels[channelId] ? Object.values(store.channels[channelId]) : [];
}

export function getAllVoicePresence(): Record<string, VoiceParticipantState[]> {
  pruneStale();
  const res: Record<string, VoiceParticipantState[]> = {};
  for (const [chId, map] of Object.entries(store.channels)) {
    const list = Object.values(map);
    if (list.length > 0) {
      res[chId] = list;
    }
  }
  return res;
}

export function sendVoiceSignal(signal: Omit<VoiceSignalMessage, "id" | "createdAt">): void {
  pruneStale();
  store.signals.push({
    ...signal,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  });
}

export function pollVoiceSignals(
  channelId: string,
  targetUserId: string,
  afterTimestamp?: number
): VoiceSignalMessage[] {
  pruneStale();
  const cutoff = afterTimestamp || Date.now() - 10_000;
  return store.signals.filter(
    (s) =>
      s.channelId === channelId &&
      s.toUserId === targetUserId &&
      s.createdAt > cutoff
  );
}
