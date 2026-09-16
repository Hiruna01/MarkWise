import { afterEach, describe, it, expect, vi } from "vitest";
import { downloadRecords } from "../lib/export";
const records = [
  {
    id: "one",
    registration: "IT 01 0002 03",
    mark: 82.75,
    page: 2,
    rowNumber: 1,
  },
];
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
describe("download exports", () => {
  it.each(["csv", "json"] as const)(
    "downloads valid %s and releases the object URL",
    async (format) => {
      vi.useFakeTimers();
      let blob: Blob | undefined;
      const create = vi.fn((value: Blob) => {
        blob = value;
        return "blob:local-export";
      });
      const revoke = vi.fn();
      vi.stubGlobal("URL", {
        createObjectURL: create,
        revokeObjectURL: revoke,
      });
      const anchor = {
        href: "",
        download: "",
        click: vi.fn(),
        remove: vi.fn(),
      };
      const append = vi.fn();
      vi.stubGlobal("document", {
        createElement: vi.fn(() => anchor),
        body: { appendChild: append },
      });
      downloadRecords(records, format);
      expect(anchor.download).toBe(`markwise-results.${format}`);
      expect(anchor.href).toBe("blob:local-export");
      expect(append).toHaveBeenCalledWith(anchor);
      expect(anchor.click).toHaveBeenCalledOnce();
      expect(anchor.remove).toHaveBeenCalledOnce();
      const content = await blob!.text();
      if (format === "json")
        expect(JSON.parse(content)).toEqual([
          {
            registration: "IT 01 0002 03",
            mark: 82.75,
            sourcePage: 2,
            rowNumber: 1,
          },
        ]);
      else expect(content).toContain('"IT 01 0002 03","82.75","2","1"');
      vi.runAllTimers();
      expect(revoke).toHaveBeenCalledWith("blob:local-export");
    },
  );
});
