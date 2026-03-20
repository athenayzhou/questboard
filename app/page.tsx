// import dynamic from "next/dynamic";

// const QuestboardClient = dynamic(() => import("../src/QuestboardClient"), {
//   ssr: false,
// });


import QuestboardClient from "../src/QuestboardClient"

export default function Page(){
  return <QuestboardClient />
}