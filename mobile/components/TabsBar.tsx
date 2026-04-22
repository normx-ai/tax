import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { fonts, fontWeights } from "@/lib/theme/fonts";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

export interface TabItem {
  id: string;
  label: string;
  icon: IoniconsName;
  route: string;
  closable: boolean;
}

interface TabsBarProps {
  openTabs: TabItem[];
  activeTab: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
}

export default function TabsBar({ openTabs, activeTab, onSelectTab, onCloseTab }: TabsBarProps) {
  if (openTabs.length <= 1) return null;

  return (
    <View style={{
      height: 38,
      backgroundColor: "#24506F",
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: "#333",
    }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {openTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => {
                onSelectTab(tab.id);
                router.push(tab.route as Href);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 14,
                backgroundColor: isActive ? "#D4A843" : "transparent",
                borderRightWidth: 1,
                borderRightColor: "#333",
              }}
            >
              <Ionicons name={tab.icon} size={14} color={isActive ? "#fff" : "#9ca3af"} />
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 12,
                  color: isActive ? "#fff" : "#9ca3af",
                  maxWidth: 120,
                }}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
              {tab.closable && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation?.();
                    onCloseTab(tab.id);
                  }}
                  hitSlop={4}
                  style={{ padding: 2, marginLeft: 2 }}
                >
                  <Ionicons name="close" size={12} color={isActive ? "#fff" : "#9ca3af"} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
