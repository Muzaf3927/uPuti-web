import { Bookmark, History, Inbox, MessageCircle, Car, User } from "lucide-react";
import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useI18n } from "@/app/i18n.jsx";
import { useBookingsUnreadCount, useGetUnreadCount } from "@/api/api";

function Navbar() {
  const location = useLocation();
  const { t, isReady } = useI18n();
  const { data: unreadCounts } = useBookingsUnreadCount();
  const { data: chatUnread } = useGetUnreadCount();
  
  const links = useMemo(() => [
    { 
      path: "/requests", 
      name: t("nav.requests"), 
      icon: <Inbox size={20} />,
      unreadCount: (unreadCounts?.my_pending_unread || 0) + (unreadCounts?.to_my_trips_pending_unread || 0)
    },
    { 
      path: "/booking", 
      name: t("nav.booking"), 
      icon: <Bookmark size={20} />,
      unreadCount: (unreadCounts?.my_confirmed_unread || 0) + (unreadCounts?.to_my_trips_confirmed_unread || 0)
    },
    { path: "/history", name: t("nav.history"), icon: <History size={20} /> },
    { path: "/", name: t("nav.trips"), icon: <Car size={20} /> },
    { path: "/orders", name: t("nav.orders"), icon: <User size={20} /> },
    { 
      path: "/chats", 
      name: t("nav.chats"), 
      icon: <MessageCircle size={20} />,
      unreadCount: chatUnread?.unread_count || 0
    },
  ], [t, unreadCounts, chatUnread]);

  if (!isReady) {
    return (
      <div className="flex justify-between p-1 sm:p-2 rounded-3xl bg-white/70 backdrop-blur-sm border shadow-sm">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="bg-white text-gray-700 text-center flex justify-center items-center flex-col w-[68px] sm:w-[88px] text-xs h-[60px] sm:h-[72px] border-2 border-green-200 rounded-2xl animate-pulse">
            <div className="w-5 h-5 bg-gray-300 rounded mb-1"></div>
            <div className="w-12 h-3 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex justify-between p-1 sm:p-2 rounded-3xl bg-gradient-to-tr from-white/70 to-cyan-50/70 dark:from-white/5 dark:to-white/10 backdrop-blur-md border shadow-md">
      {links.map((link) => {
        const isActive = location.pathname === link.path;
        return (
          <Link
            key={link.path}
            to={link.path}
            className={`${
              isActive ? "bg-gradient-to-tr from-primary to-cyan-400 text-primary-foreground shadow" : "bg-white/90 dark:bg-white/10 text-gray-700 dark:text-white"
            } text-center flex justify-center items-center flex-col w-[68px] sm:w-[88px] text-xs h-[60px] sm:h-[72px] border border-border rounded-2xl transition-all duration-300 hover:bg-accent/60 hover:shadow-[0px_5px_15px_rgba(56,189,248,0.35)] relative`}
          >
            <div className="relative">
              {link.icon}
              {link.unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-destructive text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {link.unreadCount > 9 ? '9+' : link.unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-xs md:text-sm leading-tight px-1 text-center">{link.name}</span>
          </Link>
        );
      })}
    </div>
  );
}

export default Navbar;
