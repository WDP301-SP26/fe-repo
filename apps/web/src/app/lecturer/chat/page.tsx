'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  chatAPI,
  classAPI,
  groupAPI,
  semesterAPI,
  type ChatConversation,
  type ChatMessage,
  type GetOrCreateGroupConversationInput,
} from '@/lib/api';
import { isAPIError } from '@/lib/api-error';
import { getApiBaseUrl } from '@/lib/runtime-config';
import { useAuthStore } from '@/stores/authStore';
import { Loader2, MessageSquare, Send } from 'lucide-react';
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
  if (conversation.is_group_room && conversation.group_name) {
    return conversation.group_name;
  }

  return (
    conversation.counterpart?.full_name ||
    conversation.counterpart?.email ||
    conversation.counterpart?.id ||
    'Unknown conversation'
  );
}

type MyClassItem = {
  id: string;
  code: string;
  name: string;
  semester?: string | null;
  semester_id?: string | null;
};

export default function LecturerChatPage() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const socketRef = useRef<Socket | null>(null);
  const selectedConversationIdRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localTypingConversationRef = useRef<string | null>(null);
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);
  const hasBootstrappedDefaultConversations = useRef(false);

  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [messageDraft, setMessageDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isRemoteTyping, setIsRemoteTyping] = useState(false);
  const [bootstrappingConversations, setBootstrappingConversations] =
    useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [openingGroupId, setOpeningGroupId] = useState<string | null>(null);

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
      revalidateOnFocus: false,
    },
  );

  const conversations = (conversationResponse?.data || []).filter(
    (conversation) => conversation.is_group_room,
  );

  const { data: myClassesResponse, isLoading: classesLoading } = useSWR(
    user ? '/api/classes/my-classes' : null,
    classAPI.getMyClasses,
    {
      revalidateOnFocus: false,
    },
  );

  const classOptions = useMemo(
    () => (myClassesResponse || []) as MyClassItem[],
    [myClassesResponse],
  );

  const selectedClass = useMemo(
    () => classOptions.find((item) => item.id === selectedClassId) || null,
    [classOptions, selectedClassId],
  );

  useEffect(() => {
    if (!classOptions.length) {
      setSelectedClassId(null);
      return;
    }

    if (
      !selectedClassId ||
      !classOptions.some((item) => item.id === selectedClassId)
    ) {
      setSelectedClassId(classOptions[0].id);
    }
  }, [classOptions, selectedClassId]);

  const { data: classGroups, isLoading: groupsLoading } = useSWR(
    user && selectedClassId ? ['/api/groups/class', selectedClassId] : null,
    ([, classId]) => groupAPI.getGroupsByClass(classId),
    {
      revalidateOnFocus: false,
    },
  );

  const selectedClassConversations = useMemo(
    () =>
      selectedClassId
        ? conversations.filter(
            (conversation) => conversation.class_id === selectedClassId,
          )
        : conversations,
    [conversations, selectedClassId],
  );

  const conversationByGroupId = useMemo(
    () =>
      new Map(
        selectedClassConversations
          .filter((conversation) => !!conversation.group_id)
          .map((conversation) => [
            conversation.group_id as string,
            conversation,
          ]),
      ),
    [selectedClassConversations],
  );

  const { data: lecturerReviewSummary } = useSWR(
    user ? '/api/semester/reviews/lecturer-summary' : null,
    () => semesterAPI.getLecturerReviewSummary(),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  const { data: currentSemester } = useSWR(
    user ? '/api/semesters/current' : null,
    semesterAPI.getCurrentSemester,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  useEffect(() => {
    if (!user) {
      hasBootstrappedDefaultConversations.current = false;
      setBootstrappingConversations(false);
      return;
    }

    if (conversationLoading) {
      return;
    }

    if (hasBootstrappedDefaultConversations.current) {
      return;
    }

    const summary = lecturerReviewSummary;
    const semesterId = summary?.semester?.id;
    if (!summary || !semesterId) {
      return;
    }

    const existingPairs = new Set(
      conversations.map((conversation) =>
        conversation.group_id
          ? `${conversation.class_id}:${conversation.group_id}`
          : '',
      ),
    );

    const pendingMap = new Map<string, GetOrCreateGroupConversationInput>();
    summary.classes.forEach((classItem) => {
      classItem.groups.forEach((group) => {
        const key = `${classItem.class_id}:${group.group_id}`;
        if (existingPairs.has(key) || pendingMap.has(key)) {
          return;
        }
        pendingMap.set(key, {
          semester_id: semesterId,
          class_id: classItem.class_id,
          group_id: group.group_id,
          lecturer_id: user.id,
        });
      });
    });

    const missingConversations = Array.from(pendingMap.values());
    hasBootstrappedDefaultConversations.current = true;

    if (missingConversations.length === 0) {
      return;
    }

    setBootstrappingConversations(true);
    Promise.allSettled(
      missingConversations.map((payload) =>
        chatAPI.getOrCreateGroupConversation(payload),
      ),
    )
      .then(async (results) => {
        const createdCount = results.filter(
          (result) => result.status === 'fulfilled',
        ).length;

        await mutateConversations();

        if (createdCount > 0) {
          toast.success('Đã tạo hội thoại mặc định', {
            description: `Tạo ${createdCount} room chat theo nhóm của lớp.`,
          });
        }
      })
      .finally(() => {
        setBootstrappingConversations(false);
      });
  }, [
    conversationLoading,
    conversations,
    lecturerReviewSummary,
    mutateConversations,
    user,
  ]);

  useEffect(() => {
    if (!selectedConversationId && selectedClassConversations.length > 0) {
      setSelectedConversationId(selectedClassConversations[0].id);
    }

    if (
      selectedConversationId &&
      !selectedClassConversations.some(
        (conversation) => conversation.id === selectedConversationId,
      )
    ) {
      setSelectedConversationId(selectedClassConversations[0]?.id || null);
    }
  }, [selectedClassConversations, selectedConversationId]);

  const selectedConversation = useMemo(
    () =>
      selectedClassConversations.find(
        (conversation) => conversation.id === selectedConversationId,
      ) || null,
    [selectedClassConversations, selectedConversationId],
  );

  const handleSelectGroup = async (group: {
    id: string;
    name?: string | null;
  }) => {
    const existing = conversationByGroupId.get(group.id);
    if (existing) {
      setSelectedConversationId(existing.id);
      return;
    }

    const semesterFromSummary = lecturerReviewSummary?.classes?.some(
      (item) => item.class_id === selectedClassId,
    )
      ? lecturerReviewSummary?.semester?.id
      : undefined;

    const semesterId =
      selectedClassConversations[0]?.semester_id ||
      selectedClass?.semester_id ||
      semesterFromSummary ||
      (currentSemester &&
      (!selectedClass?.semester ||
        selectedClass.semester === currentSemester.code)
        ? currentSemester.id
        : undefined);
    if (!semesterId || !selectedClassId) {
      toast.error('Chưa xác định được học kỳ hiện tại để tạo room chat.');
      return;
    }

    try {
      setOpeningGroupId(group.id);
      const payload: GetOrCreateGroupConversationInput = {
        semester_id: semesterId,
        class_id: selectedClassId,
        group_id: group.id,
        lecturer_id: user?.id,
      };
      const conversation = await chatAPI.getOrCreateGroupConversation(payload);
      await mutateConversations();
      setSelectedConversationId(conversation.id);
    } catch (error) {
      const message = isAPIError(error)
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Không thể mở group chat';
      toast.error('Mở group chat thất bại', { description: message });
    } finally {
      setOpeningGroupId(null);
    }
  };

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
      revalidateOnFocus: false,
    },
  );

  const messages: ChatMessage[] = (messageResponse?.data || [])
    .slice()
    .reverse();

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  // Silent polling fallback to keep chat fresh when websocket events are delayed.
  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    const intervalId = setInterval(() => {
      void mutateMessages();
      void mutateConversations();
    }, 3000);

    return () => {
      clearInterval(intervalId);
    };
  }, [selectedConversationId, mutateConversations, mutateMessages]);

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

    const viewport = messagesViewportRef.current;
    if (viewport) {
      requestAnimationFrame(() => {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: 'smooth',
        });
      });
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
          Trao đổi theo các group chat của lớp/học kỳ.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Group conversations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-2 pb-2">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Class
              </div>
              <Select
                value={selectedClassId ?? ''}
                onValueChange={(value) => setSelectedClassId(value)}
                disabled={classesLoading || classOptions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn lớp" />
                </SelectTrigger>
                <SelectContent>
                  {classOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.code} - {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {conversationLoading && (
              <p className="text-sm text-muted-foreground">
                Loading conversations...
              </p>
            )}
            {!conversationLoading && bootstrappingConversations && (
              <p className="text-sm text-muted-foreground">
                Đang đồng bộ hội thoại mặc định theo danh sách nhóm...
              </p>
            )}
            {!conversationLoading && conversationError && (
              <p className="text-sm text-destructive">
                Failed to load conversations.
              </p>
            )}
            {!conversationLoading && !conversationError && groupsLoading && (
              <p className="text-sm text-muted-foreground">Loading groups...</p>
            )}
            {!conversationLoading &&
              !conversationError &&
              !groupsLoading &&
              (classGroups || []).length === 0 && (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Lớp này chưa có group nào.
                </div>
              )}
            {(classGroups || []).map((group: { id: string; name: string }) => {
              const conversation = conversationByGroupId.get(group.id) || null;
              const active = conversation?.id === selectedConversationId;
              const isOpening = openingGroupId === group.id;
              const unread = conversation?.unread_count || 0;

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => void handleSelectGroup(group)}
                  className={`w-full rounded-md border p-3 text-left transition ${
                    active
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  disabled={isOpening}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium truncate">{group.name}</p>
                    <div className="flex items-center gap-2">
                      {isOpening ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : null}
                      {unread > 0 ? <Badge>{unread}</Badge> : null}
                    </div>
                  </div>
                  {conversation ? (
                    <>
                      <p className="mt-1 text-sm text-muted-foreground truncate">
                        {conversation.last_message_preview || 'No messages yet'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(conversation.last_message_at)}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Chưa có room chat. Bấm để tạo/mở room.
                    </p>
                  )}
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 flex flex-col lg:h-[calc(100vh-220px)] lg:min-h-[560px]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {selectedConversation
                ? `Chat with ${displayName(selectedConversation)}`
                : 'Select a conversation'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
            <div
              ref={messagesViewportRef}
              className="flex-1 min-h-[260px] overflow-y-auto rounded-md border bg-muted/20 p-3"
            >
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
