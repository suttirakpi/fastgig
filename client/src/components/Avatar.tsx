export default function Avatar({
  name,
  src,
  big = false,
}: {
  name: string;
  src?: string | null;
  big?: boolean;
}) {
  return (
    <div className={big ? "avatar big" : "avatar"}>
      {src ? (
        <img src={src} alt={name} loading="lazy" />
      ) : (
        name.charAt(0).toUpperCase() || "?"
      )}
    </div>
  );
}
