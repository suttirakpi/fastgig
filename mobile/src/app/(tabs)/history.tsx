import { StyleSheet, View } from "react-native";
import { Empty, PageHeader } from "../../components/ui";
import { colors } from "../../lib/theme";

export default function History() {
  return (
    <View style={styles.root}>
      <PageHeader title="ประวัติ" />
      <Empty message="หน้านี้ (Find Jobs / My Jobs) จะเพิ่มในขั้นถัดไป" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
