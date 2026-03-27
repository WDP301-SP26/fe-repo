'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  chatAPI,
  type ChatConversation,
  type ChatMessage,
  type GetOrCreateConversationInput,
} from '@/lib/api';
import { isAPIError } from '@/lib/api-error';
import { getApiBaseUrl } from '@/lib/runtime-config';
import { useAuthStore } from '@/stores/authStore';
import { MessageSquare, Send } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import useSWR from 'swr';

function formatDateTime(value: string | null) {
  if (!value) {
    return '--';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('vi-VN');
}

function displayName(conversation: ChatConversation) {
  return (
    conversation.counterpart.full_name ||
    conversation.counterpart.email ||
    conversation.counterpart.id
  );
}

export default function LecturerChatPage() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const socketRef = useRef<Socket | null>(null);
  const selectedConversationIdRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localTypingConversationRef = useRef<string | null>(null);

  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [messageDraft, setMessageDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isRemoteTyping, setIsRemoteTyping] = useState(false);
  const [contextInput, setContextInput] =
    useState<GetOrCreateConversationInput>({
      semester_id: '',
      class_id: '',
      student_id: '',
      lecturer_id: user?.id || '',
    });

  useEffect(() => {
    if (user?.id) {
      setContextInput((prev) => ({ ...prev, lecturer_id: user.id }));
    }
  }, [user?.id]);

  const {
    data: conversationResponse,
    isLoading: conversationLoading,
    error: conversationError,
    mutate: mutateConversations,
  } = useSWR(
    user ? '/api/chat/conversations' : null,
    chatAPI.listConversations,
    {
      refreshInterval: 0,
    },
  );

  const conversations = conversationResponse?.data || [];

  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }

    if (
      selectedConversationId &&
      !conversations.some(
        (conversation) => conversation.id === selectedConversationId,
      )
    ) {
      setSelectedConversationId(conversations[0]?.id || null);
    }
  }, [conversations, selectedConversationId]);

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === selectedConversationId,
      ) || null,
    [conversations, selectedConversationId],
  );

  const {
    data: messageResponse,
    isLoading: messageLoading,
    mutate: mutateMessages,
  } = useSWR(
    selectedConversationId
      ? ['/api/chat/conversations/messages', selectedConversationId]
      : null,
    ([, conversationId]) => chatAPI.listMessages(conversationId, { limit: 50 }),
    {
      refreshInterval: 0,
    },
  );

  const messages: ChatMessage[] = (messageResponse?.data || [])
    .slice()
    .reverse();

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    if (!user || !token) {
      setSocketConnected(false);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(`${apiBaseUrl}/chat`, {
      transports: ['websocket'],
      withCredentials: true,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    const handleConnect = () => {
      setSocketConnected(true);
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    const handleSocketError = (payload: {
      code?: string;
      message?: string;
    }) => {
      if (payload?.message) {
        toast.error('Chat socket error', { description: payload.message });
      }
    };

    const handleNewMessage = (incoming: ChatMessage) => {
      if (incoming.conversation_id === selectedConversationIdRef.current) {
        mutateMessages(
          (current) => {
            if (!current) {
              return {
                data: [incoming],
                meta: {
                  next_cursor: null,
                  limit: 50,
                  has_more: false,
                },
              };
            }

            if (current.data.some((item) => item.id === incoming.id)) {
              return current;
            }

            return {
              ...current,
              data: [incoming, ...current.data],
            };
          },
          { revalidate: false },
        );

        const currentSelectedConversationId = incoming.conversation_id;
        socket.emit('chat:read', {
          conversation_id: currentSelectedConversationId,
        });
      }

      mutateConversations();
    };

    const handleRead = (payload: { conversation_id: string }) => {
      if (payload?.conversation_id === selectedConversationIdRef.current) {
        mutateMessages();
      }
      mutateConversations();
    };

    const handleTyping = (payload: {
      conversation_id: string;
      sender_id: string;
      is_typing: boolean;
    }) => {
      if (payload.conversation_id !== selectedConversationIdRef.current) {
        return;
      }
      if (payload.sender_id === user.id) {
        return;
      }
      setIsRemoteTyping(!!payload.is_typing);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('chat:error', handleSocketError);
    socket.on('chat:new', handleNewMessage);
    socket.on('chat:read', handleRead);
    socket.on('chat:typing', handleTyping);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('chat:error', handleSocketError);
      socket.off('chat:new', handleNewMessage);
      socket.off('chat:read', handleRead);
      socket.off('chat:typing', handleTyping);
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      setSocketConnected(false);
      setIsRemoteTyping(false);
    };
  }, [apiBaseUrl, mutateConversations, mutateMessages, token, user]);

  useEffect(() => {
    setIsRemoteTyping(false);
  }, [selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    const hasUnread = conversations.some(
      (conversation) =>
        conversation.id === selectedConversationId &&
        conversation.unread_count > 0,
    );

    if (!hasUnread) {
      return;
    }

    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('chat:read', { conversation_id: selectedConversationId });
      return;
    }

    chatAPI
      .markConversationRead(selectedConversationId)
      .then(() => mutateConversations())
      .catch(() => {
        // Ignore read sync errors to keep chat usage uninterrupted.
      });
  }, [conversations, mutateConversations, selectedConversationId]);

  const handleCreateConversation = async () => {
    if (
      !contextInput.semester_id ||
      !contextInput.class_id ||
      !contextInput.student_id
    ) {
      toast.error('Vui lòng nhập đủ Semester ID, Class ID và Student ID');
      return;
    }

    if (!contextInput.lecturer_id) {
      toast.error('Không tìm thấy lecturer_id hiện tại. Hãy đăng nhập lại.');
      return;
    }

    try {
      setCreating(true);
      const conversation = await chatAPI.getOrCreateConversation(contextInput);
      await mutateConversations();
      setSelectedConversationId(conversation.id);
      toast.success('Đã mở hội thoại thành công');
    } catch (error) {
      const message = isAPIError(error)
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Không thể mở hội thoại';
      toast.error('Mở hội thoại thất bại', { description: message });
    } finally {
      setCreating(false);
    }
  };

  const handleSend = async () => {
    if (!selectedConversationId) {
      toast.error('Hãy chọn một hội thoại trước');
      return;
    }

    const content = messageDraft.trim();
    if (!content) {
      return;
    }

    try {
      setSending(true);
      const socket = socketRef.current;

      if (socket?.connected) {
        if (localTypingConversationRef.current === selectedConversationId) {
          socket.emit('chat:typing:stop', {
            conversation_id: selectedConversationId,
          });
          localTypingConversationRef.current = null;
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
          }
        }

        await new Promise<void>((resolve, reject) => {
          socket.emit(
            'chat:send',
            {
              conversation_id: selectedConversationId,
              content,
              type: 'TEXT',
              client_id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            },
            (response?: { code?: string; message?: string }) => {
              if (response?.code && response.code !== 'OK') {
                reject(new Error(response.message || 'Socket send failed'));
                return;
              }
              resolve();
            },
          );

          setTimeout(() => resolve(), 1500);
        });
      } else {
        await chatAPI.sendMessage(selectedConversationId, {
          content,
          type: 'TEXT',
        });
      }

      setMessageDraft('');
      await Promise.all([mutateMessages(), mutateConversations()]);
    } catch (error) {
      const message = isAPIError(error)
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Không thể gửi tin nhắn';
      toast.error('Gửi tin nhắn thất bại', { description: message });
    } finally {
      setSending(false);
    }
  };

  const handleDraftChange = (value: string) => {
    setMessageDraft(value);

    const socket = socketRef.current;
    const conversationId = selectedConversationIdRef.current;
    if (!socket?.connected || !conversationId) {
      return;
    }

    if (!localTypingConversationRef.current && value.trim().length > 0) {
      socket.emit('chat:typing:start', { conversation_id: conversationId });
      localTypingConversationRef.current = conversationId;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (localTypingConversationRef.current) {
        socket.emit('chat:typing:stop', {
          conversation_id: localTypingConversationRef.current,
        });
        localTypingConversationRef.current = null;
      }
      typingTimeoutRef.current = null;
    }, 1200);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      const socket = socketRef.current;
      if (socket?.connected && localTypingConversationRef.current) {
        socket.emit('chat:typing:stop', {
          conversation_id: localTypingConversationRef.current,
        });
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Lecturer Chat</h1>
          <Badge variant={socketConnected ? 'default' : 'secondary'}>
            {socketConnected ? 'Realtime connected' : 'Realtime disconnected'}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-1">
          Trao đổi trực tiếp với sinh viên theo từng lớp/học kỳ.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Get or Create Conversation</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
          <Input
            placeholder="Semester ID"
            value={contextInput.semester_id}
            onChange={(event) =>
              setContextInput((prev) => ({
                ...prev,
                semester_id: event.target.value,
              }))
            }
          />
          <Input
            placeholder="Class ID"
            value={contextInput.class_id}
            onChange={(event) =>
              setContextInput((prev) => ({
                ...prev,
                class_id: event.target.value,
              }))
            }
          />
          <Input
            placeholder="Student ID"
            value={contextInput.student_id}
            onChange={(event) =>
              setContextInput((prev) => ({
                ...prev,
                student_id: event.target.value,
              }))
            }
          />
          <Input
            placeholder="Lecturer ID"
            value={contextInput.lecturer_id}
            onChange={(event) =>
              setContextInput((prev) => ({
                ...prev,
                lecturer_id: event.target.value,
              }))
            }
            disabled
          />
          <Button onClick={handleCreateConversation} disabled={creating}>
            {creating ? 'Opening...' : 'Open Chat'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {conversationLoading && (
              <p className="text-sm text-muted-foreground">
                Loading conversations...
              </p>
            )}
            {!conversationLoading && conversationError && (
              <p className="text-sm text-destructive">
                Failed to load conversations.
              </p>
            )}
            {!conversationLoading &&
              !conversationError &&
              conversations.length === 0 && (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Chưa có hội thoại nào. Bạn có thể mở hội thoại mới bằng
                  context ở trên.
                </div>
              )}
            {conversations.map((conversation) => {
              const active = conversation.id === selectedConversationId;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={`w-full rounded-md border p-3 text-left transition ${
                    active
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium truncate">
                      {displayName(conversation)}
                    </p>
                    {conversation.unread_count > 0 && (
                      <Badge>{conversation.unread_count}</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground truncate">
                    {conversation.class_code} - {conversation.semester_name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground truncate">
                    {conversation.last_message_preview || 'No messages yet'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(conversation.last_message_at)}
                  </p>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {selectedConversation
                ? `Chat with ${displayName(selectedConversation)}`
                : 'Select a conversation'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-96 overflow-y-auto rounded-md border bg-muted/20 p-3">
              {!selectedConversation && (
                <p className="text-sm text-muted-foreground">
                  Chọn một hội thoại bên trái để xem lịch sử tin nhắn.
                </p>
              )}
              {selectedConversation && messageLoading && (
                <p className="text-sm text-muted-foreground">
                  Loading messages...
                </p>
              )}
              {selectedConversation &&
                !messageLoading &&
                messages.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Chưa có tin nhắn nào.
                  </p>
                )}
              {selectedConversation &&
                !messageLoading &&
                messages.map((message) => {
                  const isMine = message.sender_id === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`mb-2 flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          isMine
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background border'
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className="mt-1 text-[11px] opacity-80">
                          {formatDateTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>

            {selectedConversation && isRemoteTyping && (
              <p className="text-xs text-muted-foreground px-1">
                {displayName(selectedConversation)} đang nhập...
              </p>
            )}

            <div className="flex gap-2">
              <Input
                placeholder="Nhập tin nhắn..."
                value={messageDraft}
                onChange={(event) => handleDraftChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                disabled={!selectedConversation || sending}
              />
              <Button
                onClick={handleSend}
                disabled={!selectedConversation || sending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
