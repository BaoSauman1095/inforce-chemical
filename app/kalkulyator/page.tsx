import type { Metadata } from "next";
import GrainAdvisor from "@/components/GrainAdvisor";

export const metadata: Metadata = {
  title: "Калькулятор продажу зерна",
  description:
    "Яку культуру і скільки тонн продати зараз, щоб отримати потрібну суму і найменше втратити, коли ціни на зерно наблизяться до світових.",
  alternates: { canonical: "/kalkulyator" },
};

export default function KalkulyatorPage() {
  return <GrainAdvisor />;
}
