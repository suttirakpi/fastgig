import Svg, { Circle, Path } from "react-native-svg";

export type IconName = "home" | "user" | "clock" | "bell";

export default function Icon({
  name,
  color,
  size = 22,
}: {
  name: IconName;
  color: string;
  size?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === "home" && (
        <Path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
      )}
      {name === "user" && (
        <>
          <Circle cx={12} cy={8} r={4} />
          <Path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
        </>
      )}
      {name === "clock" && (
        <>
          <Circle cx={12} cy={12} r={9} />
          <Path d="M12 7v5l3 2" />
        </>
      )}
      {name === "bell" && (
        <>
          <Path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7" />
          <Path d="M10 20a2 2 0 0 0 4 0" />
        </>
      )}
    </Svg>
  );
}
