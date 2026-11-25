import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import Icon from "../../components/Icon";
import type { IconName } from "../../components/Icon";
import { colors } from "../../lib/theme";

function tabIcon(name: IconName) {
  return function TabIcon({ focused }: { focused: boolean }) {
    return (
      <View
        style={[
          styles.iconWrap,
          focused && { backgroundColor: colors.purpleDeep },
        ]}
      >
        <Icon name={name} color={colors.white} />
      </View>
    );
  };
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: colors.white,
        tabBarStyle: {
          backgroundColor: colors.purple,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          borderTopWidth: 0,
          position: "absolute",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "หน้าแรก", tabBarIcon: tabIcon("home") }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "โปรไฟล์", tabBarIcon: tabIcon("user") }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: "ประวัติ", tabBarIcon: tabIcon("clock") }}
      />
      <Tabs.Screen
        name="notifications"
        options={{ title: "แจ้งเตือน", tabBarIcon: tabIcon("bell") }}
      />
      <Tabs.Screen name="dashboard" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
});
