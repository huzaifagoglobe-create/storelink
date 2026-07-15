import type { PlanTier } from "@/server/types";
import { PLAN_LABEL } from "@/server/plans";

const planCls: Record<PlanTier, string> = {
  trial: "bg-[#ECEEED] text-[#6E7A75]",
  basic: "bg-[#E7EEFB] text-[#2b4a86]",
  pro: "bg-[#DDECE3] text-[#2C6B57]",
  premium: "bg-[#EFE6FB] text-[#5b3a86]",
};

export function PlanBadge({ plan }: { plan: PlanTier }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${planCls[plan]}`}
    >
      {PLAN_LABEL[plan]}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex rounded-full bg-[#DDECE3] px-2.5 py-0.5 text-xs font-medium text-[#2C6B57]">
      Active
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-[#F6E3DF] px-2.5 py-0.5 text-xs font-medium text-[#8f4a3a]">
      Paused
    </span>
  );
}
