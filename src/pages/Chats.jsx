import { Card, CardContent } from "@/components/ui/card";
import React, { useState, useRef, useEffect, useMemo } from "react";

// shadcn
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useLocation, useNavigate } from "react-router-dom";
import {
  useGetUserChats,
  useGetChatMessages,
  useSendChatMessage,
  useGetData,
} from "@/api/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Check, CheckCheck, X, ArrowLeft, Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/app/i18n.jsx";
import { useSelector } from "react-redux";
import { useKeyboardInsets } from "@/hooks/useKeyboardInsets.jsx";
import EmptyState from "@/components/EmptyState.jsx";
import { useSmartRefresh } from "@/hooks/useSmartRefresh.jsx";

function Chats() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const initialTripId = params.get("tripId");
  const initialReceiverId = params.get("receiverId");
  // Получаем данные пользователя через API
  const { data: currentUser } = useGetData("/users/me");
  const currentUserId = currentUser?.id;
  

  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const queryClient = useQueryClient();
  
  const { data: chatsRes, refetch: refetchChats } = useGetUserChats();
  const chats = chatsRes?.chats || [];

  // Умное автоматическое обновление чатов
  const { forceRefresh, resetActivityFlags } = useSmartRefresh(
    () => {
      refetchChats();
    },
    5000, // обновляем каждые 5 секунд
    [refetchChats]
  );

  // Автоматическое обновление данных при переходе на страницу
  useEffect(() => {
    if (location.pathname === "/chats") {
      refetchChats();
    }
  }, [location.pathname, refetchChats]);

  // Если есть параметры в URL, автоматически открываем чат
  useEffect(() => {
    if (initialTripId && initialReceiverId && chats.length > 0) {
      const chat = chats.find(
        (c) =>
          String(c.trip_id) === String(initialTripId) &&
          String(c.chat_partner_id) === String(initialReceiverId)
      );
      if (chat) {
        setSelectedChat(chat);
      }
    }
  }, [initialTripId, initialReceiverId, chats]);

  const { data: messagesRes } = useGetChatMessages(
    selectedChat?.trip_id,
    selectedChat?.chat_partner_id,
    Boolean(selectedChat?.trip_id && selectedChat?.chat_partner_id)
  );
  const messages = messagesRes?.messages || [];
  const sendMutation = useSendChatMessage(selectedChat?.trip_id);

  // iOS keyboard/safe-area handling
  const { keyboardInset, viewportHeight } = useKeyboardInsets();

  const handleSend = async () => {
    if (!message.trim() || !selectedChat?.chat_partner_id || !selectedChat?.trip_id) return;
    try {
      await sendMutation.mutateAsync({
        receiver_id: Number(selectedChat.chat_partner_id),
        message,
      });
      setMessage("");
      inputRef.current?.focus();
      // Принудительно обновляем данные после отправки сообщения
      resetActivityFlags();
      forceRefresh();
    } catch (_err) {}
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    // Обновляем URL без перезагрузки страницы
    navigate(`/chats?tripId=${chat.trip_id}&receiverId=${chat.chat_partner_id}`, { replace: true });
  };

  const handleBackToList = () => {
    setSelectedChat(null);
    navigate('/chats', { replace: true });
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // После открытия чата — обновим список чатов, чтобы обнулить непрочитанные
  useEffect(() => {
    if (selectedChat?.trip_id && selectedChat?.chat_partner_id) {
      queryClient.invalidateQueries({ queryKey: ["chats", "list"] });
    }
  }, [selectedChat?.trip_id, selectedChat?.chat_partner_id, queryClient]);

  // Блокируем скролл фона когда открыт чат
  useEffect(() => {
    if (!selectedChat) return;
    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY || window.pageYOffset;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPosition = body.style.position;
    const prevBodyTop = body.style.top;
    const prevBodyWidth = body.style.width;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.position = prevBodyPosition;
      body.style.top = prevBodyTop;
      body.style.width = prevBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [selectedChat]);

  // Если выбран чат, показываем интерфейс чата
  if (selectedChat) {
    return (
      <>
        {/* Затемненный фон */}
        <div 
          className="fixed inset-0 bg-black/30 z-40 overscroll-contain touch-none"
          onClick={handleBackToList}
        />
        {/* Чат */}
        <Card className="border py-0 relative rounded-3xl overflow-hidden shadow-lg fixed left-1/2 -translate-x-1/2 w-[95vw] max-w-md z-50" style={{ 
          bottom: keyboardInset ? `${keyboardInset + 8}px` : '8px',
          maxHeight: viewportHeight ? `${Math.min(viewportHeight - (keyboardInset || 0) - 16, 90)}vh` : '90vh',
          height: viewportHeight && keyboardInset ? `${viewportHeight - keyboardInset - 16}px` : '85vh'
        }}>
        <CardContent className="flex flex-col h-full bg-card/90 backdrop-blur-sm" style={{ backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.10), rgba(79,70,229,0.08))" }}>
          {/* Заголовок чата */}
          <div className="flex items-center justify-between px-3 py-2 border-b bg-card/95 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="size-7 ring-1 ring-white shadow">
                <AvatarFallback className="text-xs">
                  {getInitials(selectedChat.partner?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-gray-900 truncate text-xs">
                  {selectedChat.partner?.name || t("common.user")}
                </span>
                <span className="text-[10px] text-gray-500 truncate">
                  {selectedChat.trip?.from_city} → {selectedChat.trip?.to_city}
                </span>
              </div>
            </div>
            <Button
              onClick={handleBackToList}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 rounded-full hover:bg-accent/60"
              aria-label="Close chat"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Область сообщений */}
          <div
            className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 ring-1 ring-blue-200/60 overscroll-contain touch-pan-y"
            style={{
              backgroundImage: 'linear-gradient(135deg, rgba(59,130,246,0.10), rgba(79,70,229,0.06))',
            }}
          >
            
            {messages.map((msg) => {
              const isMyMessage = Number(msg.sender_id) === Number(currentUserId);
              
              return (
                <div
                  key={msg.id}
                  className={`flex w-full ${isMyMessage ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex flex-col max-w-[75%] ${isMyMessage ? "items-end" : "items-start"}`}>
                    <div
                      className={`px-2 py-1 rounded-xl shadow-sm relative text-xs ${
                        isMyMessage
                          ? "text-white rounded-br-md"
                          : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
                      }`}
                      style={isMyMessage ? { backgroundImage: 'linear-gradient(135deg, rgba(59,130,246,0.90), rgba(79,70,229,0.88))' } : undefined}
                    >
                      <p className="text-xs leading-tight pr-8">{msg.message}</p>
                      <div className={`absolute bottom-0.5 ${
                        isMyMessage ? "right-1.5" : "right-1.5"
                      } flex items-center gap-0.5`}>
                        <span className="text-[9px] opacity-70">
                          {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {isMyMessage && (
                          <span>
                            {msg.is_read ? (
                              <CheckCheck className="w-2.5 h-2.5 text-primary/40" />
                            ) : (
                              <Check className="w-2.5 h-2.5 text-primary/40" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Поле ввода */}
          <div className="border-t bg-card/95 backdrop-blur-sm px-2 py-1.5 sticky bottom-0">
            <div className="flex items-center gap-1.5">
              <Input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("chats.placeholder")}
                className="flex-1 rounded-full border-gray-200 focus:border-primary focus:ring-primary/50 text-xs h-8"
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                ref={inputRef}
                autoFocus
              />
              <Button
                onClick={handleSend}
                className="h-8 w-8 rounded-full bg-primary hover:brightness-110 flex items-center justify-center"
                size="sm"
                disabled={!message.trim()}
              >
                <Send className="w-3 h-3 text-white" />
              </Button>
            </div>
          </div>
        </CardContent>
        {/* RefreshFab рендерится глобально из MainLayout через портал */}
        </Card>
      </>
    );
  }

  // Если чат не выбран, показываем список чатов
  return (
    <Card className="h-[100dvh] sm:h-full border py-0 relative rounded-3xl overflow-hidden shadow-lg">
      <CardContent className="flex flex-col h-full bg-card/90 backdrop-blur-sm">
        {/* Заголовок */}
        <div className="px-4 py-4 border-b bg-card/95 backdrop-blur-sm">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-primary" />
            {t("chats.title")}
          </h1>
        </div>

        {/* Список чатов */}
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={<MessageCircle className="w-8 h-8 text-primary" />}
                title={t("chats.noChats")}
                description={t("chats.noChatsDescription")}
              />
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {chats.map((chat) => (
                <div
                  key={`${chat.trip_id}-${chat.chat_partner_id}`}
                  onClick={() => handleChatSelect(chat)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/60 cursor-pointer transition-colors group"
                >
                  <div className="relative">
                    <Avatar className="size-12 ring-2 ring-white shadow-sm">
                      <AvatarFallback className="font-semibold text-white">
                        {getInitials(chat.partner?.name)}
                      </AvatarFallback>
                    </Avatar>
                    {Number(chat.unread_count || 0) > 0 && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {chat.unread_count}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
                        {chat.partner?.name || t("common.user")}
                      </h3>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        {chat.last_message_at && (
                          <>
                            {new Date(chat.last_message_at).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit'
                            })}
                            {chat.last_message_is_read === true ? (
                              <CheckCheck className="w-3 h-3 text-blue-500" />
                            ) : (
                              <Check className="w-3 h-3 text-gray-400" />
                            )}
                          </>
                        )}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 truncate">
                      {chat.trip?.from_city} → {chat.trip?.to_city}
                    </p>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">
                        {Number(chat.trip?.price || 0).toLocaleString()} сум
                      </p>
                      <p className="text-xs text-gray-500">
                        {chat.trip?.date} • {chat.trip?.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      {/* RefreshFab рендерится глобально из MainLayout через портал */}
    </Card>
  );
}

export default Chats;