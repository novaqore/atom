import React from "react";
import { Box, Text } from "ink";
import { renderMarkdown } from "../../utils/markdown.js";

export const AssistantMessage = React.memo(function AssistantMessage({
  content,
  streaming = false,
}) {
  const rendered = renderMarkdown(content, { streaming });
  const nlIdx = rendered.indexOf("\n");
  const firstLine = nlIdx === -1 ? rendered : rendered.slice(0, nlIdx);
  const rest = nlIdx === -1 ? "" : rendered.slice(nlIdx + 1);

  return React.createElement(
    Box,
    { marginBottom: streaming ? 0 : 1, flexDirection: "column" },
    React.createElement(
      Text,
      null,
      React.createElement(Text, { bold: true, color: "cyan" }, "Atom:"),
      " ",
      firstLine
    ),
    rest ? React.createElement(Text, null, rest) : null
  );
});
