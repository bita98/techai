"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const themes = [
  { name: "light", color: "#f5f5f5" },
  { name: "dark", color: "#18181b" },
  { name: "purple", color: "#8b5cf6" },
  { name: "pink", color: "#ec4899" },
  { name: "yellow", color: "#eab308" },
  { name: "brown", color: "#92400e" },
  { name: "blue", color: "#3b82f6" },
];

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("light");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState("");
  const [copiedMessage, setCopiedMessage] = useState("");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const savedChats = localStorage.getItem("techai-chats");
    const savedTheme = localStorage.getItem("techai-color");

    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);

      setChats(parsedChats);

      if (parsedChats.length > 0) {
        setActiveChat(parsedChats[0].id);
        setMessages(parsedChats[0].messages);
      }
    }

    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("techai-chats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem("techai-color", theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  const createNewChat = () => {
    setMessages([]);
    setActiveChat(null);
    setMessage("");
    setSidebarOpen(false);
  };

  const saveChat = (chatMessages) => {
    if (!chatMessages.length) return;

    const firstUserMessage =
      chatMessages.find((item) => item.role === "user")?.content ||
      "گفتگوی جدید";

    const title =
      firstUserMessage.length > 28
        ? `${firstUserMessage.slice(0, 28)}...`
        : firstUserMessage;

    if (activeChat) {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChat
            ? {
                ...chat,
                messages: chatMessages,
              }
            : chat
        )
      );
    } else {
      const newChat = {
        id: Date.now(),
        title,
        messages: chatMessages,
      };

      setChats((prev) => [newChat, ...prev]);
      setActiveChat(newChat.id);
    }
  };

  const selectChat = (chat) => {
    setActiveChat(chat.id);
    setMessages(chat.messages);
    setSidebarOpen(false);
  };

  const deleteChat = (chatId) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));

    if (activeChat === chatId) {
      setActiveChat(null);
      setMessages([]);
    }
  };

  const deleteAllChats = () => {
    if (chats.length === 0) return;

    const confirmed = confirm("مطمئنی می‌خوای همه چت‌ها حذف بشن؟");

    if (!confirmed) return;

    setChats([]);
    setActiveChat(null);
    setMessages([]);
  };

  const renameChat = (chatId, currentTitle) => {
    const newTitle = prompt("اسم جدید چت:", currentTitle);

    if (!newTitle?.trim()) return;

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              title: newTitle.trim(),
            }
          : chat
      )
    );
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);

      setTimeout(() => {
        setCopiedCode("");
      }, 1500);
    } catch (error) {
      console.error(error);
    }
  };

  const copyMessage = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessage(content);

      setTimeout(() => {
        setCopiedMessage("");
      }, 1500);
    } catch (error) {
      console.error(error);
    }
  };

  const regenerateResponse = async (index) => {
    if (loading) return;

    const previousMessages = messages.slice(0, index);

    if (!previousMessages.length) return;

    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: previousMessages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.response || "خطایی اتفاق افتاد");
      }

      const finalMessages = [
        ...previousMessages,
        {
          role: "assistant",
          content: data.response,
        },
      ];

      setMessages(finalMessages);
      saveChat(finalMessages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text = message) => {
    const trimmedMessage = text.trim();

    if (!trimmedMessage || loading) return;

    const userMessage = {
      role: "user",
      content: trimmedMessage,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.response || "خطایی اتفاق افتاد");
      }

      const assistantMessage = {
        role: "assistant",
        content: data.response,
      };

      const finalMessages = [...updatedMessages, assistantMessage];

      setMessages(finalMessages);
      saveChat(finalMessages);
    } catch (error) {
      console.error(error);

      const errorMessage = {
        role: "assistant",
        content: "یه مشکلی پیش اومد. یه بار دیگه امتحان کن.",
      };

      const finalMessages = [...updatedMessages, errorMessage];

      setMessages(finalMessages);
      saveChat(finalMessages);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const suggestions = [
    "React و Next.js چه فرقی دارن؟",
    "برام یه پروژه ساده با Next.js پیشنهاد بده",
    "هوش مصنوعی چطور کار می‌کنه؟",
    "Git و GitHub چه فرقی دارن؟",
  ];

  return (
    <main className="app">
      <button
        className={`sidebar-overlay ${sidebarOpen ? "show" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-label="بستن منو"
      />

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-icon">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v4" />
                <path d="M12 18v4" />
                <path d="m4.93 4.93 2.83 2.83" />
                <path d="m16.24 16.24 2.83 2.83" />
                <path d="M2 12h4" />
                <path d="M18 12h4" />
                <path d="m4.93 19.07 2.83-2.83" />
                <path d="m16.24 7.76 2.83-2.83" />
                <circle cx="12" cy="12" r="4" />
              </svg>
            </div>

            <div>
              <h1>TechAI</h1>
              <span>Technology Assistant</span>
            </div>
          </div>

          <button className="new-chat" onClick={createNewChat}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>

            چت جدید
          </button>
        </div>

        <div className="chat-history">
          <div className="history-title">
            <span>تاریخچه چت‌ها</span>

            {chats.length > 0 && (
              <button
                className="clear-history"
                onClick={deleteAllChats}
              >
                حذف همه
              </button>
            )}
          </div>

          <div className="history-list">
            {chats.length === 0 ? (
              <div className="empty-history">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                </svg>

                <span>هنوز چتی وجود نداره</span>
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`history-item ${
                    activeChat === chat.id ? "active" : ""
                  }`}
                  onClick={() => selectChat(chat)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                  </svg>

                  <span className="history-text">
                    {chat.title}
                  </span>

                  <div className="history-actions">
                    <button
                      className="delete-chat"
                      onClick={(event) => {
                        event.stopPropagation();
                        renameChat(chat.id, chat.title);
                      }}
                      aria-label="تغییر نام چت"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                      </svg>
                    </button>

                    <button
                      className="delete-chat"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteChat(chat.id);
                      }}
                      aria-label="حذف چت"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      >
                        <path d="M6 6l12 12M18 6 6 18" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="sidebar-bottom">
          <div className="theme-title">تم</div>

          <div className="theme-list">
            {themes.map((item) => (
              <button
                key={item.name}
                className={`theme-option ${
                  theme === item.name ? "active" : ""
                }`}
                onClick={() => setTheme(item.name)}
                aria-label={`تم ${item.name}`}
              >
                <span
                  className="theme-color"
                  style={{ background: item.color }}
                />
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="chat-area">
        <header className="chat-header">
          <button
            className="mobile-menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="باز کردن منو"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          </button>

          <div className="header-info">
            <div className="online-dot" />
            <span>TechAI</span>
          </div>

          <button
            className="header-new-chat"
            onClick={createNewChat}
            aria-label="چت جدید"
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </button>
        </header>

        <div className="messages-area">
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="welcome-icon">
                <svg
                  width="34"
                  height="34"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v4" />
                  <path d="M12 18v4" />
                  <path d="m4.93 4.93 2.83 2.83" />
                  <path d="m16.24 16.24 2.83 2.83" />
                  <path d="M2 12h4" />
                  <path d="M18 12h4" />
                  <path d="m4.93 19.07 2.83-2.83" />
                  <path d="m16.24 7.76 2.83-2.83" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </div>

              <h2>سلام! من TechAI هستم</h2>

              <p>
                دستیار هوشمند تو برای برنامه‌نویسی و دنیای تکنولوژی
              </p>

              <div className="suggestions">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                  >
                    {suggestion}

                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages">
              {messages.map((item, index) => (
                <div
                  key={index}
                  className={`message-row ${
                    item.role === "user"
                      ? "user-row"
                      : "assistant-row"
                  }`}
                >
                  {item.role === "assistant" && (
                    <div className="message-avatar">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 2v4" />
                        <path d="M12 18v4" />
                        <path d="m4.93 4.93 2.83 2.83" />
                        <path d="m16.24 16.24 2.83 2.83" />
                        <path d="M2 12h4" />
                        <path d="M18 12h4" />
                        <path d="m4.93 19.07 2.83-2.83" />
                        <path d="m16.24 7.76 2.83-2.83" />
                        <circle cx="12" cy="12" r="4" />
                      </svg>
                    </div>
                  )}

                  <div className="message-content">
                    {item.role === "assistant" ? (
                      <>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({
                              inline,
                              className,
                              children,
                              ...props
                            }) {
                              const match = /language-(\w+)/.exec(
                                className || ""
                              );

                              const code = String(children).replace(
                                /\n$/,
                                ""
                              );

                              if (!inline && match) {
                                return (
                                  <div className="code-block">
                                    <div className="code-header">
                                      <span>{match[1]}</span>

                                      <button
                                        onClick={() =>
                                          copyCode(code)
                                        }
                                      >
                                        {copiedCode === code
                                          ? "کپی شد ✓"
                                          : "کپی"}

                                        <svg
                                          width="14"
                                          height="14"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <rect
                                            width="13"
                                            height="13"
                                            x="9"
                                            y="9"
                                            rx="2"
                                          />
                                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                        </svg>
                                      </button>
                                    </div>

                                    <SyntaxHighlighter
                                      style={oneDark}
                                      language={match[1]}
                                      PreTag="div"
                                      {...props}
                                    >
                                      {code}
                                    </SyntaxHighlighter>
                                  </div>
                                );
                              }

                              return (
                                <code
                                  className={className}
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {item.content}
                        </ReactMarkdown>

                        <div className="message-actions">
                          <button
                            className="copy-message-button"
                            onClick={() =>
                              copyMessage(item.content)
                            }
                            disabled={loading}
                            aria-label="کپی پاسخ"
                          >
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect
                                width="13"
                                height="13"
                                x="9"
                                y="9"
                                rx="2"
                              />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>

                            {copiedMessage === item.content
                              ? "کپی شد ✓"
                              : "کپی"}
                          </button>

                          <button
                            className="regenerate-button"
                            onClick={() =>
                              regenerateResponse(index)
                            }
                            disabled={loading}
                            aria-label="دوباره تولید کردن جواب"
                          >
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20 11a8.1 8.1 0 0 0-15.5-2" />
                              <path d="M4 5v4h4" />
                              <path d="M4 13a8.1 8.1 0 0 0 15.5 2" />
                              <path d="M20 19v-4h-4" />
                            </svg>
                          </button>
                        </div>
                      </>
                    ) : (
                      <p>{item.content}</p>
                    )}
                  </div>

                  {item.role === "user" && (
                    <div className="message-avatar user-avatar">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="8" r="3.5" />
                        <path d="M5 21c.8-4 3-6 7-6s6.2 2 7 6" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="message-row assistant-row">
                  <div className="message-avatar">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 2v4" />
                      <path d="M12 18v4" />
                      <path d="m4.93 4.93 2.83 2.83" />
                      <path d="m16.24 16.24 2.83 2.83" />
                      <path d="M2 12h4" />
                      <path d="M18 12h4" />
                      <path d="m4.93 19.07 2.83-2.83" />
                      <path d="m16.24 7.76 2.83-2.83" />
                      <circle cx="12" cy="12" r="4" />
                    </svg>
                  </div>

                  <div className="typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="input-area">
          <form className="input-wrapper" onSubmit={handleSubmit}>
            <textarea
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="پیامت رو بنویس..."
              rows={1}
              disabled={loading}
            />

            <button
              type="submit"
              className="send-button"
              disabled={!message.trim() || loading}
              aria-label="ارسال پیام"
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </form>

          <p className="input-hint">
            TechAI ممکنه گاهی اشتباه کنه؛ اطلاعات مهم رو بررسی کن.
          </p>
        </div>
      </section>
    </main>
  );
}
