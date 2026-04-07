import React, { useState } from "react";
import { Search, Edit, ArrowLeft, Send, Image, Smile } from "lucide-react";
import { MOCK_MESSAGES, USERS } from "../data/mockData";

interface ChatMessage {
  id: string;
  text: string;
  mine: boolean;
  timestamp: string;
}

const CHAT_HISTORY: ChatMessage[] = [
  { id: "ch1", text: "Your NBA tier list is so wrong lmaoo 😭", mine: false, timestamp: "2:34 PM" },
  { id: "ch2", text: "Curry in C is disrespectful??", mine: false, timestamp: "2:35 PM" },
  { id: "ch3", text: "He's past his prime, I stand by it 😅", mine: true, timestamp: "2:37 PM" },
  { id: "ch4", text: "Absolute crime. Anyway check my new anime tier list!", mine: false, timestamp: "2:40 PM" },
  { id: "ch5", text: "omg Frieren S tier?? finally someone with taste", mine: true, timestamp: "2:41 PM" },
];

export function DMPage() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(CHAT_HISTORY);

  const activeChatUser = MOCK_MESSAGES.find((m) => m.id === activeChat)?.user;

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages([
      ...messages,
      {
        id: `msg_${Date.now()}`,
        text: newMessage.trim(),
        mine: true,
        timestamp: "Now",
      },
    ]);
    setNewMessage("");
  };

  const filteredMessages = MOCK_MESSAGES.filter(
    (m) =>
      m.user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (activeChat) {
    return (
      <div className="flex flex-col h-screen bg-white">
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-gray-100 bg-white/95 backdrop-blur-md">
          <button onClick={() => setActiveChat(null)} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={22} />
          </button>
          {activeChatUser && (
            <>
              <img
                src={activeChatUser.avatar}
                alt={activeChatUser.displayName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-bold text-gray-900 text-sm">{activeChatUser.displayName}</p>
                <p className="text-xs text-green-500 font-medium">Online</p>
              </div>
            </>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-28">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.mine ? "justify-end" : "justify-start"} gap-2`}>
              {!msg.mine && activeChatUser && (
                <img
                  src={activeChatUser.avatar}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover self-end flex-shrink-0"
                />
              )}
              <div className={`max-w-[75%]`}>
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm ${
                    msg.mine
                      ? "bg-violet-600 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>
                <p className={`text-[10px] text-gray-400 mt-1 ${msg.mine ? "text-right" : "text-left"}`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 pb-6 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <button className="text-gray-400 hover:text-violet-500 transition-colors">
              <Image size={20} />
            </button>
            <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2.5">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Message..."
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
              />
              <button className="text-gray-400 hover:text-yellow-500 transition-colors">
                <Smile size={18} />
              </button>
            </div>
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="w-10 h-10 bg-violet-600 rounded-2xl flex items-center justify-center text-white disabled:opacity-40 hover:bg-violet-700 transition-all"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-black text-gray-900">Messages</h1>
            <button className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center text-violet-500 hover:bg-violet-100 transition-colors">
              <Edit size={18} />
            </button>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full bg-gray-100 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* Suggested Users */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Quick Chat</p>
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {USERS.slice(0, 4).map((user) => (
            <button
              key={user.id}
              onClick={() => setActiveChat("msg1")}
              className="flex flex-col items-center gap-1 flex-shrink-0"
            >
              <div className="relative">
                <img src={user.avatar} alt={user.displayName} className="w-12 h-12 rounded-full object-cover" />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <span className="text-[10px] text-gray-500 max-w-[48px] truncate">{user.username}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Message List */}
      <div className="px-4 py-3 space-y-1">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-4xl">💬</span>
            <p className="text-gray-500 mt-3 text-sm">No conversations yet</p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <button
              key={msg.id}
              onClick={() => setActiveChat(msg.id)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white transition-all text-left"
            >
              <div className="relative flex-shrink-0">
                <img
                  src={msg.user.avatar}
                  alt={msg.user.displayName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                {msg.unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-violet-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center border-2 border-gray-50">
                    {msg.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${msg.unread > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>
                    {msg.user.displayName}
                  </span>
                  <span className="text-[10px] text-gray-400">{msg.timestamp}</span>
                </div>
                <p className={`text-xs truncate mt-0.5 ${msg.unread > 0 ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                  {msg.lastMessage}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
