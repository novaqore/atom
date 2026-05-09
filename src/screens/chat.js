import React, { useState, useEffect, useRef } from "react";
import { Box, Text, useInput } from "ink";
import NovaQoreAI from "@novaqore/ai";
import { SERVICE_FILE } from "../utils/paths.js";
import { tools, executeTool } from "../tools/index.js";
import { buildSystemPrompt } from "../utils/system-prompt.js";
import { ChatInput } from "../components/Chat/ChatInput.js";
import { ConfirmDangerousCommand } from "../components/Chat/ConfirmDangerousCommand.js";
import { Header } from "../components/Header.js";
import { renderMarkdown } from "../utils/markdown.js";

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
  const [running, setRunning] = useState(null);
  const [durations, setDurations] = useState({});
  const stopRef = useRef(null);

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
    if (key.escape && sending && stopRef.current) {
      const stop = stopRef.current;
      stopRef.current = null;
      stop();
    }
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

    let acc = "";
    let toolCalls = [];

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

        acc = "";
        toolCalls = [];
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
      const aborted =
        err.name === "AbortError" ||
        err.code === "ABORT_ERR" ||
        /aborted/i.test(err.message || "");
      if (aborted) {
        if (acc.trim() || toolCalls.length > 0) {
          const partial = { role: "assistant", content: acc };
          if (toolCalls.length > 0) partial.tool_calls = toolCalls;
          setMessages((prev) => [...prev, partial]);
        }
        setStreaming("");
        setStreamingTools([]);
      } else {
        setError(
          `${err.message} | ${err.cause?.code || ""} ${err.cause?.message || ""}`
        );
      }
      setSending(false);
    } finally {
      stopRef.current = null;
    }
  };

  const formatToolName = (name) =>
    name.charAt(0).toUpperCase() + name.slice(1);

  const formatToolArgs = (rawArgs) => {
    try {
      const parsed = JSON.parse(rawArgs || "{}");
      const keys = Object.keys(parsed);
      if (keys.length === 1) return String(parsed[keys[0]]);
      return keys.map((k) => `${k}=${JSON.stringify(parsed[k])}`).join(", ");
    } catch {
      return rawArgs || "";
    }
  };

  const renderToolCall = (tc, key) =>
    React.createElement(
      Box,
      { key },
      React.createElement(
        Text,
        { bold: true, color: "yellow" },
        formatToolName(tc.function.name)
      ),
      React.createElement(Text, { dimColor: true }, "("),
      React.createElement(Text, null, formatToolArgs(tc.function.arguments)),
      React.createElement(Text, { dimColor: true }, ")")
    );

  const MAX_OUTPUT_LINES = 2;

  const formatMs = (ms) =>
    ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;

  const renderToolResult = (msg, key) => {
    const content = (msg.content || "").trimEnd();
    const ms = durations[msg.tool_call_id];
    const dur = ms ? ` · ${formatMs(ms)}` : "";
    if (!content) {
      return React.createElement(
        Box,
        { key, paddingLeft: 2, marginBottom: 1 },
        React.createElement(
          Text,
          { dimColor: true },
          `⎿  (No output)${dur}`
        )
      );
    }
    const lines = content.split("\n");
    const visible = lines.slice(0, MAX_OUTPUT_LINES);
    const overflow = lines.length - MAX_OUTPUT_LINES;

    const children = visible.map((line, idx) => {
      const isLastShown = idx === visible.length - 1 && overflow === 0;
      const suffix = isLastShown ? dur : "";
      return React.createElement(
        Text,
        { key: `line-${idx}`, dimColor: true },
        idx === 0 ? `⎿  ${line}${suffix}` : `   ${line}${suffix}`
      );
    });
    if (overflow > 0) {
      children.push(
        React.createElement(
          Text,
          { key: "overflow", dimColor: true },
          `   … +${overflow} lines${dur}`
        )
      );
    }

    return React.createElement(
      Box,
      { key, flexDirection: "column", paddingLeft: 2, marginBottom: 1 },
      children
    );
  };

  return React.createElement(
    Box,
    { flexDirection: "column" },
    React.createElement(Header, { key: "header", version, unhinged }),
    ...messages.flatMap((msg, i) => {
      if (msg.role === "user") {
        return [
          React.createElement(
            Box,
            { key: `m-${i}`, marginBottom: 1 },
            React.createElement(Text, { bold: true, color: "white" }, "You: "),
            React.createElement(Text, { dimColor: true }, msg.content)
          ),
        ];
      }
      if (msg.role === "assistant") {
        const nodes = [];
        if (msg.content) {
          const rendered = renderMarkdown(msg.content);
          const nlIdx = rendered.indexOf("\n");
          const firstLine = nlIdx === -1 ? rendered : rendered.slice(0, nlIdx);
          const rest = nlIdx === -1 ? "" : rendered.slice(nlIdx + 1);
          nodes.push(
            React.createElement(
              Box,
              {
                key: `m-${i}`,
                marginBottom: 1,
                flexDirection: "column",
              },
              React.createElement(
                Box,
                null,
                React.createElement(
                  Text,
                  { bold: true, color: "cyan" },
                  "Atom:"
                ),
                React.createElement(Text, null, " ", firstLine)
              ),
              rest ? React.createElement(Text, null, rest) : null
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
      (() => {
        const rendered = renderMarkdown(streaming, { streaming: true });
        const nlIdx = rendered.indexOf("\n");
        const firstLine = nlIdx === -1 ? rendered : rendered.slice(0, nlIdx);
        const rest = nlIdx === -1 ? "" : rendered.slice(nlIdx + 1);
        return React.createElement(
          Box,
          { key: "streaming", flexDirection: "column" },
          React.createElement(
            Box,
            null,
            React.createElement(
              Text,
              { color: "cyan", bold: true },
              "Atom:"
            ),
            React.createElement(Text, null, " ", firstLine)
          ),
          rest ? React.createElement(Text, null, rest) : null
        );
      })(),
    ...streamingTools.map((tc, j) => renderToolCall(tc, `streaming-tc-${j}`)),
    running &&
      React.createElement(
        Box,
        { key: "running", paddingLeft: 2, marginBottom: 1 },
        React.createElement(
          Text,
          { dimColor: true },
          `⎿  running ${formatMs(running.elapsed)}`
        )
      ),
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
