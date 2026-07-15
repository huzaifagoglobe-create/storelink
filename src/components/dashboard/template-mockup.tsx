import { getTemplate } from "@/server/storefront-templates";

const LINE = "rounded bg-[#cdd9d2]";
const IMG = "bg-[#bccabf]";

// A small, data-free visual mock of a storefront template so sellers can SEE the layout.
export function TemplateMockup({
  id,
  accent = "#43705F",
  large = false,
}: {
  id: string;
  accent?: string;
  large?: boolean;
}) {
  const c = getTemplate(id);
  const tint = c.surface === "tint";
  const rad = c.radius === "round" ? "rounded-2xl" : c.radius === "sq" ? "rounded-none" : "rounded-lg";
  const cr = c.radius === "round" ? "rounded-xl" : c.radius === "sq" ? "rounded-none" : "rounded-md";
  const cellH = large ? "38px" : "24px";

  const header =
    c.header === "dark" ? (
      <div className="flex w-full items-center justify-between rounded bg-[#1c2b26] px-1.5 py-1">
        <div className="h-2 w-2 rounded-full" style={{ background: accent }} />
        <div className="h-1 w-6 rounded bg-white/40" />
      </div>
    ) : c.header === "bold" ? (
      <div className="h-3 w-16 rounded" style={{ background: accent }} />
    ) : c.header === "center" ? (
      <div className="flex flex-col items-center gap-1">
        <div className="h-2.5 w-2.5 rounded-full" style={{ background: accent }} />
        <div className={"h-1 w-10 " + LINE} />
      </div>
    ) : (
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: accent }} />
          <div className={"h-1 w-8 " + LINE} />
        </div>
        <div className={"h-1 w-6 " + LINE} />
      </div>
    );

  const hero =
    c.hero === "gradient" ? (
      <div className={"flex h-10 flex-col justify-end gap-1 p-1.5 " + cr} style={{ background: `linear-gradient(120deg, ${accent}, #1c2b26)` }}>
        <div className="h-1.5 w-2/3 rounded bg-white/80" />
        <div className="h-2 w-8 rounded-full bg-white" />
      </div>
    ) : c.hero === "full" ? (
      <div className={"flex h-12 flex-col justify-end gap-1 p-1.5 " + cr} style={{ background: accent + "22" }}>
        <div className="h-1.5 w-2/3 rounded" style={{ background: accent }} />
        <div className={"h-1 w-1/2 " + LINE} />
      </div>
    ) : c.hero === "banner" ? (
      <div className={"flex h-6 items-center px-2 " + cr} style={{ background: accent }}>
        <div className="h-1 w-12 rounded bg-white/70" />
      </div>
    ) : c.hero === "centered" ? (
      <div className="flex flex-col items-center gap-1 py-1.5">
        <div className="h-1.5 w-20 rounded" style={{ background: accent }} />
        <div className={"h-1 w-14 " + LINE} />
      </div>
    ) : (
      <div className="flex flex-col gap-1">
        <div className="h-1.5 w-14 rounded" style={{ background: accent }} />
        <div className="h-px w-full bg-[#e0e8e3]" />
      </div>
    );

  const cell = (h: string) => {
    if (c.card === "row")
      return (
        <div className={"flex items-center gap-1.5 border border-[#e3ebe7] p-1 " + cr}>
          <div className={"h-6 w-6 flex-none " + IMG + " " + cr} />
          <div className="flex-1 space-y-1">
            <div className={"h-1 w-full " + LINE} />
            <div className={"h-1 w-8 " + LINE} />
          </div>
        </div>
      );
    if (c.card === "overlay")
      return (
        <div className={"relative flex items-end " + IMG + " " + cr} style={{ height: h }}>
          <div className="m-1 h-1 w-8 rounded bg-white/80" />
        </div>
      );
    const border = c.card === "flat" ? "" : "border border-[#e3ebe7] ";
    return (
      <div className={border + cr + " overflow-hidden"}>
        <div className={IMG} style={{ height: h }} />
        <div className="space-y-1 p-1">
          <div className={"h-1 w-full " + LINE} />
          <div className={"h-1 w-6 " + LINE} />
        </div>
      </div>
    );
  };

  let grid;
  if (c.grid === "magazine") {
    grid = (
      <div className="space-y-1.5">
        <div className={(c.card === "flat" ? "" : "border border-[#e3ebe7] ") + cr + " overflow-hidden"}>
          <div className={IMG} style={{ height: large ? "52px" : "32px" }} />
          <div className="space-y-1 p-1">
            <div className={"h-1 w-2/3 " + LINE} />
            <div className={"h-1 w-1/3 " + LINE} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {cell(cellH)}
          {cell(cellH)}
        </div>
      </div>
    );
  } else if (c.grid === "list") {
    grid = (
      <div className="space-y-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className={"flex items-center gap-1.5 border border-[#e3ebe7] p-1 " + cr}>
            <div className={"h-7 w-7 flex-none " + IMG + " " + cr} />
            <div className="flex-1 space-y-1">
              <div className={"h-1 w-full " + LINE} />
              <div className={"h-1 w-10 " + LINE} />
            </div>
          </div>
        ))}
      </div>
    );
  } else {
    const gap = c.grid === "g2gap" ? "gap-2.5" : "gap-1.5";
    grid = (
      <div className={"grid grid-cols-2 " + gap}>
        {cell(cellH)}
        {cell(cellH)}
        {cell(cellH)}
        {cell(cellH)}
      </div>
    );
  }

  return (
    <div className={"flex flex-col gap-2 p-2 " + rad + " border border-line " + (tint ? "bg-[#F1F5F2]" : "bg-white")}>
      {header}
      {hero}
      {grid}
    </div>
  );
}
