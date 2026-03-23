// import { Html } from "@react-three/drei";
// import { useMemo } from "react";
// import { useUserStore } from "../store/user";
// import { UserNamePlate } from "./NamePlate";

// type NameProps = {
//   position?: [number, number, number];
// };

// export default function Name({ position = [0, 1.5, 0] }: NameProps) {
//   const name = useUserStore((s) => s.user.profile.name);
//   const badges = useUserStore((s) => s.user.badges);

//   const placements = useMemo(() => {
//     const unlocked = new Set(badges.unlockedBadges);
//     return badges.badgePlacements.filter(
//       (p) =>
//         unlocked.has(p.id) && badges.displayedBadgeIds.includes(p.id),
//     );
//   }, [badges]);

//   const htmlPortal = document.getElementById("html-layer");
//   if (!htmlPortal) return null;

//   return (
//     <Html
//       position={position}
//       transform
//       className="name"
//       wrapperClass="name-wrapper"
//       portal={{ current: htmlPortal }}
//       center
//     >
//       <UserNamePlate userName={name} placements={placements} />
//     </Html>
//   );
// }
