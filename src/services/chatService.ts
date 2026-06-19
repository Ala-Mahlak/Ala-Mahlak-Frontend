import type { HubConnection } from '@microsoft/signalr';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

const BASE_URL = '/api';
const TOKEN_KEY = 'ala_mahlak_token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  let body: unknown;
  try {
    body = isJson ? await res.json() : await res.text();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const msg = isJson && body && typeof body === 'object'
      ? (body as Record<string, unknown>).message || (body as Record<string, unknown>).title
      : body;
    const code = isJson && body && typeof body === 'object'
      ? (body as Record<string, unknown>).code
      : null;
    const err = new Error(typeof msg === 'string' ? msg : `HTTP ${res.status}`);
    if (code) (err as Error & { code: string }).code = code as string;
    throw err;
  }
  return body as T;
}

function makeHeaders(token: string | null): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function authGet<T>(path: string): Promise<T> {
  return fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: makeHeaders(getToken()),
  }).then((r) => handleResponse<T>(r));
}

function authPost<T>(path: string, data: unknown): Promise<T> {
  return fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: makeHeaders(getToken()),
    body: JSON.stringify(data),
  }).then((r) => handleResponse<T>(r));
}

// ─── DTOs — aligned with backend API ─────────────────────────────────────────

export interface ChatContactResponse {
  id: number;
  name: string;
  profilePhoto: string | null;
  email: string;
  role: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
}

export interface ChatConversationResponse {
  id: number;
  userId: number;
  userName: string;
  userProfilePhoto: string | null;
  adminId: number;
  adminName: string;
  adminProfilePhoto: string | null;
  createdAt: string;
  lastMessageAt: string | null;
  lastMessage: string | null;
}

export interface ChatMessageResponse {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderProfilePhoto: string | null;
  senderRole: string;
  message: string;
  sentAt: string;
}

export interface SendMessageRequest {
  partnerId: number;
  message: string;
}

// ─── REST API ────────────────────────────────────────────────────────────────

export function getChatContacts(): Promise<ChatContactResponse[]> {
  return authGet<ChatContactResponse[]>('/chat/contacts');
}

export function getChatConversations(): Promise<ChatConversationResponse[]> {
  return authGet<ChatConversationResponse[]>('/chat/conversations');
}

export function getChatMessages(partnerId: number): Promise<ChatMessageResponse[]> {
  return authGet<ChatMessageResponse[]>(`/chat/conversations/${partnerId}/messages`);
}

export function sendChatMessage(payload: SendMessageRequest): Promise<ChatMessageResponse> {
  return authPost<ChatMessageResponse>('/chat/messages', payload);
}

// ─── SignalR Hub ─────────────────────────────────────────────────────────────

let hubConnection: HubConnection | null = null;
let onReceiveMessageCallback: ((msg: ChatMessageResponse) => void) | null = null;

export function getHubConnection(): HubConnection | null {
  return hubConnection;
}

export async function startChatHub(
  onReceiveMessage: (msg: ChatMessageResponse) => void,
): Promise<void> {
  if (hubConnection?.state === 'Connected') {
    onReceiveMessageCallback = onReceiveMessage;
    return;
  }

  const token = getToken();
  if (!token) throw new Error('Authentication token not found');

  hubConnection = new HubConnectionBuilder()
    .withUrl(`/hubs/chat?access_token=${token}`)
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();

  hubConnection.on('ReceiveMessage', (msg: ChatMessageResponse) => {
    onReceiveMessageCallback?.(msg);
  });

  hubConnection.onreconnecting(() => {
    console.warn('[ChatHub] Reconnecting...');
  });

  hubConnection.onreconnected(() => {
    console.log('[ChatHub] Reconnected');
  });

  hubConnection.onclose(() => {
    console.log('[ChatHub] Connection closed');
  });

  onReceiveMessageCallback = onReceiveMessage;
  await hubConnection.start();
}

export async function stopChatHub(): Promise<void> {
  if (hubConnection) {
    await hubConnection.stop();
    hubConnection = null;
  }
  onReceiveMessageCallback = null;
}

export async function joinConversation(conversationId: number): Promise<void> {
  if (hubConnection?.state === 'Connected') {
    await hubConnection.invoke('JoinConversation', conversationId);
  }
}

export async function leaveConversation(conversationId: number): Promise<void> {
  if (hubConnection?.state === 'Connected') {
    await hubConnection.invoke('LeaveConversation', conversationId);
  }
}

export function getConversationGroupName(conversationId: number): string {
  return `chat-conversation-${conversationId}`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getPartnerFromConversation(
  conv: ChatConversationResponse,
  currentUserId: number,
): { partnerId: number; partnerName: string; partnerPhoto: string | null; partnerRole: string } {
  if (conv.userId === currentUserId) {
    return {
      partnerId: conv.adminId,
      partnerName: conv.adminName,
      partnerPhoto: conv.adminProfilePhoto,
      partnerRole: 'Admin',
    };
  }
  return {
    partnerId: conv.userId,
    partnerName: conv.userName,
    partnerPhoto: conv.userProfilePhoto,
    partnerRole: 'User',
  };
}