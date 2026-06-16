import { useState, useCallback, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { useMutation } from "@tanstack/react-query";
import { chat } from "@api/agentApi.js";
import { selectUser } from "@store/auth/authSelector.js";

/**
 * Custom hook untuk mengelola logika chat dengan AI agent.
 * @returns {Object} Chat state dan handlers
 */
export const useChat = () => {
  const user = useSelector(selectUser);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  const mutation = useMutation({
    mutationFn: chat,
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "AGENT",
          content: data?.reply || data?.message || "Tidak ada respon.",
        },
      ]);
    },
    onError: (error) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "AGENT",
          content:
            error?.response?.data?.message ||
            error?.message ||
            "Maaf, terjadi kesalahan. Silakan coba lagi.",
          isError: true,
        },
      ]);
    },
  });

  /**
   * Mengirim pesan user ke AI agent.
   */
  const sendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || mutation.isPending) return;

    const userMessage = { role: "USER", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    mutation.mutate(trimmed);
  }, [input, mutation.isPending, mutation.mutate]);

  /**
   * Inisialisasi chat dengan pesan greeting yang informatif.
   */
  const initChat = useCallback(() => {
    const firstName = user?.fullName?.split(" ")[0] || "Sobat";

    const greeting = `Halo **${firstName}**! 👋\n\nSelamat datang di **G-Speed Copilot**, asisten AI yang siap membantu operasional bengkel.\n\nKamu bisa tanya seputar performa bengkel, penjualan, stok barang, atau progress pekerjaan.\n\nYuk, mulai dengan pilih saran di bawah atau ketik langsung pertanyaanmu! 🚀`;

    setMessages([{ role: "AGENT", content: greeting }]);
  }, [user?.fullName]);

  /**
   * Auto-scroll ke bottom saat messages bertambah.
   */
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current;
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return {
    messages,
    input,
    setInput,
    sendMessage,
    initChat,
    isPending: mutation.isPending,
    scrollRef,
  };
};