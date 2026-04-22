import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/lib/theme/ThemeContext";
import { fonts, fontWeights } from "@/lib/theme/fonts";

type Props = {
  texte: string[];
  highlightIndex?: number;
  onLineLayout?: (index: number, y: number) => void;
};

function getLineType(line: string) {
  if (/^\([ivx]+\)\s/.test(line)) return "roman";
  if (/^\d+-\s/.test(line)) return "sectionHeader";
  if (/^\d+°\s/.test(line)) return "degree";
  if (/^\d+\)\s/.test(line) || /^\d+\.\s/.test(line)) return "numbered";
  if (/^[a-z]\)\s/.test(line)) return "lettered";
  if (/^-\s/.test(line) || line.startsWith("- ") || line.startsWith("• ") || line.startsWith("○ ")) return "dash";
  if (/^\d+[A-Z]?\.\d+\./.test(line)) return "subsection";
  return "paragraph";
}

export default function ArticleText({ texte, highlightIndex, onLineLayout }: Props) {
  const { colors } = useTheme();

  function renderInlineRoman(text: string) {
    const parts = text.split(/(\([ivx]+\))/g);
    if (parts.length === 1) return <Text selectable={false} style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>{text}</Text>;

    return (
      <Text selectable={false} style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
        {parts.map((part, i) =>
          /^\([ivx]+\)$/.test(part) ? (
            <Text key={i} selectable={false} style={{ fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: colors.primary }}>{part}</Text>
          ) : (
            <Text key={i} selectable={false}>{part}</Text>
          )
        )}
      </Text>
    );
  }

  const isHighlighted = (i: number) => highlightIndex !== undefined && i === highlightIndex;

  const highlightStyle = {
    backgroundColor: "rgba(212,160,23,0.25)",
    borderLeftWidth: 4,
    borderLeftColor: "#D4A017",
    paddingLeft: 6,
    paddingVertical: 2,
  };

  const wrapLine = (i: number, content: React.ReactNode) => (
    <View
      key={i}
      onLayout={onLineLayout ? (e) => onLineLayout(i, e.nativeEvent.layout.y) : undefined}
      style={isHighlighted(i) ? highlightStyle : undefined}
    >
      {content}
    </View>
  );

  return (
    <View>
      {texte.map((line, i) => {
        if (line === "") return wrapLine(i, <View style={{ height: 14 }} />);

        const type = getLineType(line);

        if (type === "sectionHeader") {
          return wrapLine(i,
            <View style={{ marginTop: 16, marginBottom: 8 }}>
              <Text selectable={false} style={{ fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 17, color: "#D4A017" }}>{line}</Text>
            </View>
          );
        }

        if (type === "subsection") {
          return wrapLine(i,
            <View style={{ marginTop: 16, marginBottom: 8 }}>
              <Text selectable={false} style={{ fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 17, color: colors.primary }}>{line}</Text>
            </View>
          );
        }

        if (type === "degree") {
          const marker = line.match(/^(\d+°)/)?.[1] || "";
          return wrapLine(i,
            <View style={{ flexDirection: "row", paddingLeft: 40, marginBottom: 8 }}>
              <Text selectable={false} style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 17, color: "#D4A017", minWidth: 30 }}>
                {marker}
              </Text>
              <Text selectable={false} style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 17, color: colors.text, lineHeight: 22, flex: 1, textAlign: 'justify' }}>
                {renderInlineRoman(line.replace(/^\d+°\s*/, ""))}
              </Text>
            </View>
          );
        }

        if (type === "numbered") {
          return wrapLine(i,
            <View style={{ flexDirection: "row", paddingLeft: 8, marginBottom: 8 }}>
              <Text selectable={false} style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 17, color: colors.primary, width: 24 }}>
                {line.match(/^(\d+[\.\)])/)?.[1]}
              </Text>
              <Text selectable={false} style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 17, color: colors.text, lineHeight: 22, flex: 1, textAlign: 'justify' }}>
                {renderInlineRoman(line.replace(/^\d+[\.\)]\s*/, ""))}
              </Text>
            </View>
          );
        }

        if (type === "lettered") {
          return wrapLine(i,
            <View style={{ flexDirection: "row", paddingLeft: 24, marginBottom: 4 }}>
              <Text selectable={false} style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 17, color: colors.textMuted, width: 20 }}>
                {line.match(/^([a-z]\))/)?.[1]}
              </Text>
              <Text selectable={false} style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 17, color: colors.text, lineHeight: 22, flex: 1, textAlign: 'justify' }}>
                {renderInlineRoman(line.replace(/^[a-z]\)\s*/, ""))}
              </Text>
            </View>
          );
        }

        if (type === "roman") {
          const marker = line.match(/^(\([ivx]+\))/)?.[1] || "";
          return wrapLine(i,
            <View style={{ flexDirection: "row", paddingLeft: 40, marginBottom: 4 }}>
              <Text selectable={false} style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 16, color: colors.primary, width: 28 }}>
                {marker}
              </Text>
              <Text selectable={false} style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 17, color: colors.text, lineHeight: 22, flex: 1, textAlign: 'justify' }}>
                {line.replace(/^\([ivx]+\)\s*/, "")}
              </Text>
            </View>
          );
        }

        if (type === "dash") {
          const isSubBullet = line.startsWith("○ ");
          return wrapLine(i,
            <View style={{ flexDirection: "row", marginBottom: 4, paddingLeft: isSubBullet ? 32 : 16 }}>
              <Text selectable={false} style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 17, color: isSubBullet ? colors.textMuted : colors.primary, marginRight: 8 }}>{isSubBullet ? "○" : "•"}</Text>
              <Text selectable={false} style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 17, color: colors.text, lineHeight: 22, flex: 1, textAlign: 'justify' }}>
                {renderInlineRoman(line.replace(/^[-•○]\s*/, ""))}
              </Text>
            </View>
          );
        }

        return wrapLine(i,
          <Text selectable={false} style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 17, color: colors.text, lineHeight: 22, marginBottom: 8, textAlign: 'justify' }}>
            {renderInlineRoman(line)}
          </Text>
        );
      })}
    </View>
  );
}
