import React, { useState, useEffect, useRef } from "react";
import { Box, Text, useInput } from "ink";
import NovaQoreAI from "@novaqore/ai";
import { SERVICE_FILE } from "../utils/paths.js";
import { tools, executeTool } from "../tools/index.js";
import { buildSystemPrompt } from "../utils/system-prompt.js";
import { ChatInput } from "../components/Chat/ChatInput.js";
import { ConfirmDangerousCommand } from "../components/Chat/ConfirmDangerousCommand.js";
import { UserMessage } from "../components/Chat/UserMessage.js";
import { AssistantMessage } from "../components/Chat/AssistantMessage.js";
import { ToolCall } from "../components/Chat/ToolCall.js";
import { ToolResult } from "../components/Chat/ToolResult.js";
import { RunningIndicator } from "../components/Chat/RunningIndicator.js";
import { Header } from "../components/Header.js";

export function ChatScreen({ version, unhinged, onBack }) {
  const [nq] = useState(() => new NovaQoreAI(SERVICE_FILE));
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState("");
  const [streamingTools, setStreamingTools] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [usage, setUsage] = useState({ prompt: 0, completion: 0, total: 0 });
  const [cwd, setCwd] = useState(process.cwd());
  const [running, setRunning] = useState(null);
  const [durations, setDurations] = useState({});
  const stopRef = useRef(null);
  const abortedRef = useRef(false);

  const toApiMessage = (m) => {
    if (m.role === "tool") {
      return {
        role: "tool",
        tool_call_id: m.tool_call_id,
        content: m.content,
      };
    }
    return m;
  };

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRunning((r) => (r ? { ...r, elapsed: Date.now() - r.start } : null));
    }, 100);
    return () => clearInterval(id);
  }, [running?.id]);

  useInput((_input, key) => {
    if (!key.escape) return;
    if (sending && stopRef.current) {
      abortedRef.current = true;
      const stop = stopRef.current;
      stopRef.current = null;
      stop();
      return;
    }
    if (!sending && onBack) onBack();
  });

  const askConfirm = (command) =>
    new Promise((resolve) => setConfirm({ command, resolve }));

  const handleSubmit = async (text) => {
    if (!text.trim() || sending) return;

    let convo = [...messages, { role: "user", content: text }];
    setMessages(convo);
    setInput("");
    setSending(true);
    setError(null);

    try {
      while (true) {
        setStreaming("");
        setStreamingTools([]);

        const { stream, stop } = await nq.chat(
          [
            { role: "system", content: buildSystemPrompt() },
            ...convo.map(toApiMessage),
          ],
          { stream: true, tools }
        );
        stopRef.current = stop;

        let acc = "";
        const toolCalls = [];
        for await (const chunk of stream) {
          if (chunk.timings) {
            const t = chunk.timings;
            const promptTokens = (t.cache_n || 0) + (t.prompt_n || 0);
            const completionTokens = t.predicted_n || 0;
            setUsage((prev) => ({
              prompt: prev.prompt + promptTokens,
              completion: prev.completion + completionTokens,
              total: prev.total + promptTokens + completionTokens,
            }));
          }
          const delta = chunk.choices[0]?.delta;
          if (delta?.content) {
            acc += delta.content;
            setStreaming(acc);
          }
          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const i = tc.index ?? 0;
              if (!toolCalls[i]) {
                toolCalls[i] = {
                  id: tc.id || "",
                  type: "function",
                  function: {
                    name: tc.function?.name || "",
                    arguments: tc.function?.arguments || "",
                  },
                };
              } else {
                if (tc.id) toolCalls[i].id = tc.id;
                if (tc.function?.name)
                  toolCalls[i].function.name += tc.function.name;
                if (tc.function?.arguments)
                  toolCalls[i].function.arguments += tc.function.arguments;
              }
            }
            setStreamingTools([...toolCalls]);
          }
        }

        setStreaming("");
        setStreamingTools([]);

        if (abortedRef.current) {
          abortedRef.current = false;
          if (acc.trim()) {
            const partial = { role: "assistant", content: acc };
            convo = [...convo, partial];
            setMessages(convo);
          }
          break;
        }

        const assistantMsg = { role: "assistant", content: acc };
        if (toolCalls.length > 0) assistantMsg.tool_calls = toolCalls;
        convo = [...convo, assistantMsg];
        setMessages(convo);

        if (toolCalls.length === 0) break;

        for (const tc of toolCalls) {
          const start = Date.now();
          setRunning({ id: tc.id, start, elapsed: 0 });
          const result = await executeTool(
            tc.function.name,
            tc.function.arguments,
            { askConfirm, unhinged, cwd, setCwd }
          );
          const duration = Date.now() - start;
          setRunning(null);
          setDurations((prev) => ({ ...prev, [tc.id]: duration }));
          convo = [
            ...convo,
            {
              role: "tool",
              tool_call_id: tc.id,
              content: result,
            },
          ];
          setMessages(convo);
        }
      }
      setSending(false);
    } catch (err) {
      setError(
        `${err.message} | ${err.cause?.code || ""} ${err.cause?.message || ""}`
      );
      setSending(false);
    } finally {
      stopRef.current = null;
      abortedRef.current = false;
    }
  };

  return React.createElement(
    Box,
    { flexDirection: "column" },
    React.createElement(Header, { key: "header", version, unhinged }),
    ...messages.flatMap((msg, i) => {
      if (msg.role === "user") {
        return [
          React.createElement(UserMessage, {
            key: `m-${i}`,
            content: msg.content,
          }),
        ];
      }
      if (msg.role === "assistant") {
        const nodes = [];
        if (msg.content) {
          nodes.push(
            React.createElement(AssistantMessage, {
              key: `m-${i}`,
              content: msg.content,
            })
          );
        }
        if (msg.tool_calls) {
          for (let j = 0; j < msg.tool_calls.length; j++) {
            nodes.push(
              React.createElement(ToolCall, {
                key: `m-${i}-tc-${j}`,
                tc: msg.tool_calls[j],
              })
            );
          }
        }
        return nodes;
      }
      if (msg.role === "tool") {
        return [
          React.createElement(ToolResult, {
            key: `m-${i}`,
            msg,
            duration: durations[msg.tool_call_id],
          }),
        ];
      }
      return [];
    }),
    streaming &&
      React.createElement(AssistantMessage, {
        key: "streaming",
        content: streaming,
        streaming: true,
      }),
    ...streamingTools.map((tc, j) =>
      React.createElement(ToolCall, { key: `streaming-tc-${j}`, tc })
    ),
    running &&
      React.createElement(RunningIndicator, {
        key: "running",
        elapsed: running.elapsed,
      }),
    error &&
      React.createElement(Text, { key: "error", color: "red" }, `Error: ${error}`),
    confirm
      ? React.createElement(ConfirmDangerousCommand, {
          key: "confirm",
          command: confirm.command,
          onAnswer: (value) => {
            const { resolve } = confirm;
            setConfirm(null);
            resolve(value);
          },
        })
      : React.createElement(ChatInput, {
          key: "input",
          value: input,
          onChange: setInput,
          onSubmit: handleSubmit,
          cwd,
          totalTokens: usage.total,
          loading: sending && !streaming && streamingTools.length === 0,
          disabled: sending,
        })
  );
}
