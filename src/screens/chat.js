import React, { useState } from "react";
import { Box, Text } from "ink";
import NovaQoreAI from "@novaqore/ai";
import { SERVICE_FILE } from "../utils/paths.js";
import { tools, executeTool } from "../tools/index.js";
import { buildSystemPrompt } from "../utils/system-prompt.js";
import { ChatInput } from "../components/Chat/ChatInput.js";
import { ConfirmDangorusCommand } from "../components/Chat/ConfirmDangorusCommand.js";
import { Header } from "../components/Header.js";

export function ChatScreen({ version, unhinged }) {
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

        const { stream } = await nq.chat(
          [{ role: "system", content: buildSystemPrompt() }, ...convo],
          { stream: true, tools }
        );

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

        const assistantMsg = { role: "assistant", content: acc };
        if (toolCalls.length > 0) assistantMsg.tool_calls = toolCalls;
        convo = [...convo, assistantMsg];
        setMessages(convo);
        setStreaming("");
        setStreamingTools([]);

        if (toolCalls.length === 0) break;

        for (const tc of toolCalls) {
          const result = await executeTool(
            tc.function.name,
            tc.function.arguments,
            { askConfirm, unhinged, cwd, setCwd }
          );
          convo = [
            ...convo,
            { role: "tool", tool_call_id: tc.id, content: result },
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
    }
  };

  const renderToolCall = (tc, key) =>
    React.createElement(
      Box,
      { key },
      React.createElement(
        Text,
        { color: "yellow", bold: true },
        `${tc.function.name} `
      ),
      React.createElement(Text, { color: "gray" }, tc.function.arguments)
    );

  const renderToolResult = (msg, key) =>
    React.createElement(
      Box,
      { key, flexDirection: "column" },
      React.createElement(Text, { color: "gray" }, msg.content)
    );

  return React.createElement(
    Box,
    { flexDirection: "column" },
    React.createElement(Header, { key: "header", version }),
    ...messages.flatMap((msg, i) => {
      if (msg.role === "user") {
        return [
          React.createElement(
            Box,
            { key: `m-${i}` },
            React.createElement(Text, { bold: true, color: "white" }, "You: "),
            React.createElement(Text, { dimColor: true }, msg.content)
          ),
        ];
      }
      if (msg.role === "assistant") {
        const nodes = [];
        if (msg.content) {
          nodes.push(
            React.createElement(
              Box,
              { key: `m-${i}` },
              React.createElement(Text, { bold: true, color: "blue" }, "Atom: "),
              React.createElement(Text, null, msg.content)
            )
          );
        }
        if (msg.tool_calls) {
          for (let j = 0; j < msg.tool_calls.length; j++) {
            nodes.push(renderToolCall(msg.tool_calls[j], `m-${i}-tc-${j}`));
          }
        }
        return nodes;
      }
      if (msg.role === "tool") {
        return [renderToolResult(msg, `m-${i}`)];
      }
      return [];
    }),
    streaming &&
      React.createElement(
        Box,
        { key: "streaming" },
        React.createElement(Text, { color: "blue", bold: true }, "Atom: "),
        React.createElement(Text, null, streaming)
      ),
    ...streamingTools.map((tc, j) => renderToolCall(tc, `streaming-tc-${j}`)),
    error &&
      React.createElement(Text, { key: "error", color: "red" }, `Error: ${error}`),
    confirm
      ? React.createElement(ConfirmDangorusCommand, {
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
        })
  );
}
