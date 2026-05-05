import Image from "next/image";

export default function DashboardLogo() {
  return (
    <Image
      src="/logo.svg"
      alt="ShelfCast"
      width={160}
      height={32}
      style={{ height: 32, width: "auto" }}
      priority
    />
  );
}
