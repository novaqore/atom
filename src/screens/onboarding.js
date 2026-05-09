import React, { useState, useEffect, useRef } from "react";
import { Box, Text, useApp, useStdin } from "ink";
import { writeFile, mkdir } from "node:fs/promises";
import { ATOM_DIR, SERVICE_FILE } from "../utils/paths.js";
import { Header } from "../components/Header.js";

const STEPS = [
  { key: "uid", name: "UID", label: "Enter your UID" },
  { key: "keyId", name: "Key ID", label: "Enter your Key ID" },
  { key: "quantumKey", name: "Quantum Key", label: "Enter your Quantum Key" },
];

function PasteInput({ onSubmit, onCancel, onExit }) {
  const { stdin, setRawMode } = useStdin();
  const [value, setValue] = useState("");
  const valueRef = useRef("");

  useEffect(() => {
    setRawMode(true);
    const handler = (data) => {
      const str = data.toString();

      if (str === "\x03") {
        onExit();
        return;
      }
      if (str === "\x1b") {
        onCancel();
        return;
      }

      const newlineIdx = str.search(/\r|\n/);
      if (newlineIdx >= 0) {
        const before = str.slice(0, newlineIdx).replace(/[\x00-\x1f\x7f]/g, "");
        valueRef.current += before;
        onSubmit(valueRef.current);
        return;
      }
      if (str === "\x7f" || str === "\b") {
        valueRef.current = valueRef.current.slice(0, -1);
        setValue(valueRef.current);
        return;
      }
      const cleaned = str.replace(/[\x00-\x1f\x7f]/g, "");
      if (cleaned) {
        valueRef.current += cleaned;
        setValue(valueRef.current);
      }
    };
    stdin.on("data", handler);
    return () => {
      stdin.off("data", handler);
      setRawMode(false);
    };
  }, [onSubmit, onCancel, onExit, stdin, setRawMode]);

  return React.createElement(Text, null, "•".repeat(value.length));
}

export function OnboardingScreen({ version, unhinged, onComplete, onBack }) {
  const { exit } = useApp();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (step < STEPS.length || saved) return;
    setSaved(true);
    mkdir(ATOM_DIR, { recursive: true, mode: 0o700 })
      .then(() =>
        writeFile(SERVICE_FILE, JSON.stringify(values, null, 2), { mode: 0o600 })
      )
      .then(() => onComplete());
  }, [step, saved, values, onComplete]);

  const isComplete = step >= STEPS.length;

  return React.createElement(
    Box,
    { flexDirection: "column", paddingBottom: 1 },
    React.createElement(Header, { version, unhinged }),
    React.createElement(
      Box,
      { marginTop: 1, paddingX: 1, flexDirection: "column" },
      React.createElement(
        Box,
        null,
        React.createElement(Text, null, "Sign up at "),
        React.createElement(Text, { color: "cyan" }, "https://novaqore.ai"),
        React.createElement(Text, null, " and generate your keys at "),
        React.createElement(
          Text,
          { color: "cyan" },
          "https://chat.novaqore.ai/keys"
        ),
        React.createElement(Text, null, ", then paste each value below.")
      ),
      React.createElement(
        Text,
        { dimColor: true },
        "Keys are stored locally in ~/.atom/."
      ),
      React.createElement(
        Box,
        { marginTop: 1, flexDirection: "column" },
        STEPS.map((s) => {
          const filled = values[s.key] !== undefined;
          return React.createElement(
            Box,
            { key: s.key },
            filled
              ? React.createElement(
                  Text,
                  { color: "green", bold: true },
                  "  ✓  "
                )
              : React.createElement(Text, { dimColor: true }, "  ·  "),
            React.createElement(
              Text,
              filled ? null : { dimColor: true },
              s.name
            )
          );
        })
      ),
      isComplete
        ? React.createElement(
            Box,
            { marginTop: 1 },
            React.createElement(Text, { color: "green" }, "Saving...")
          )
        : React.createElement(
            Box,
            {
              marginTop: 1,
              borderStyle: "single",
              borderTop: true,
              borderBottom: true,
              borderLeft: false,
              borderRight: false,
              borderColor: "gray",
            },
            React.createElement(
              Text,
              { color: "white" },
              `${STEPS[step].label}: `
            ),
            React.createElement(PasteInput, {
              key: step,
              onSubmit: (val) => {
                setValues({ ...values, [STEPS[step].key]: val });
                setStep(step + 1);
              },
              onCancel: onBack,
              onExit: exit,
            })
          ),
      React.createElement(
        Box,
        { marginTop: 1 },
        React.createElement(Text, { color: "yellow", bold: true }, "[Esc]"),
        React.createElement(Text, { dimColor: true }, " Back")
      )
    )
  );
}
