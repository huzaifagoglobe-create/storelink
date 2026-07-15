import { describe, it, expect } from "vitest";
import { sniffImageType } from "@/server/image";

const pad = (head: number[]) => Buffer.concat([Buffer.from(head), Buffer.alloc(16)]);

describe("image magic-byte sniffing", () => {
  it("recognises real image signatures", () => {
    expect(sniffImageType(pad([0xff, 0xd8, 0xff]))).toBe("image/jpeg");
    expect(sniffImageType(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(sniffImageType(pad([0x47, 0x49, 0x46, 0x38]))).toBe("image/gif");
    const webp = Buffer.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    expect(sniffImageType(webp)).toBe("image/webp");
  });
  it("rejects non-images (e.g. HTML/script disguised as png)", () => {
    expect(sniffImageType(Buffer.from("<script>alert(1)</script>"))).toBe(null);
    expect(sniffImageType(Buffer.from("%PDF-1.7"))).toBe(null);
    expect(sniffImageType(Buffer.alloc(4))).toBe(null);
  });
});
