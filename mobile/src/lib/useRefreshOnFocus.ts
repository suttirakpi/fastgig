import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef } from "react";

// โหลดข้อมูลใหม่ทุกครั้งที่กลับมาที่หน้านี้ (ข้ามครั้งแรก เพราะ useGet โหลดอยู่แล้ว)
export function useRefreshOnFocus(reload: () => Promise<void>) {
  const reloadRef = useRef(reload);
  const first = useRef(true);

  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      void reloadRef.current();
    }, []),
  );
}
