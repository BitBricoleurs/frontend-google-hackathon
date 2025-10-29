import { cn, formatDateTime } from "../utils";

describe("utils", () => {
  describe("cn", () => {
    it("should merge class names", () => {
      const result = cn("text-red-500", "bg-blue-500");
      expect(result).toContain("text-red-500");
      expect(result).toContain("bg-blue-500");
    });

    it("should handle conditional class names", () => {
      const result = cn("base-class", true && "conditional-class", false && "not-included");
      expect(result).toContain("base-class");
      expect(result).toContain("conditional-class");
      expect(result).not.toContain("not-included");
    });

    it("should merge conflicting tailwind classes correctly", () => {
      // tw-merge should keep the last conflicting class
      const result = cn("p-4", "p-8");
      expect(result).toBe("p-8");
    });

    it("should handle arrays of classes", () => {
      const result = cn(["text-lg", "font-bold"]);
      expect(result).toContain("text-lg");
      expect(result).toContain("font-bold");
    });

    it("should handle empty input", () => {
      const result = cn();
      expect(result).toBe("");
    });

    it("should handle undefined and null values", () => {
      const result = cn(undefined, null, "valid-class");
      expect(result).toBe("valid-class");
    });
  });

  describe("formatDateTime", () => {
    it("should format date correctly", () => {
      const date = new Date("2024-01-15T14:30:00");
      const result = formatDateTime(date);

      expect(result.date).toBe("MON, JAN 15");
      expect(result.time).toBe("14:30");
    });

    it("should format time with leading zeros", () => {
      const date = new Date("2024-03-05T09:05:00");
      const result = formatDateTime(date);

      expect(result.date).toBe("TUE, MAR 5");
      expect(result.time).toBe("09:05");
    });

    it("should handle Sunday correctly", () => {
      const date = new Date("2024-01-07T12:00:00"); // Sunday
      const result = formatDateTime(date);

      expect(result.date).toBe("SUN, JAN 7");
    });

    it("should handle Saturday correctly", () => {
      const date = new Date("2024-01-06T12:00:00"); // Saturday
      const result = formatDateTime(date);

      expect(result.date).toBe("SAT, JAN 6");
    });

    it("should handle all months correctly", () => {
      const months = [
        { date: new Date("2024-01-01"), expected: "JAN" },
        { date: new Date("2024-02-01"), expected: "FEB" },
        { date: new Date("2024-03-01"), expected: "MAR" },
        { date: new Date("2024-04-01"), expected: "APR" },
        { date: new Date("2024-05-01"), expected: "MAY" },
        { date: new Date("2024-06-01"), expected: "JUN" },
        { date: new Date("2024-07-01"), expected: "JUL" },
        { date: new Date("2024-08-01"), expected: "AUG" },
        { date: new Date("2024-09-01"), expected: "SEP" },
        { date: new Date("2024-10-01"), expected: "OCT" },
        { date: new Date("2024-11-01"), expected: "NOV" },
        { date: new Date("2024-12-01"), expected: "DEC" },
      ];

      months.forEach(({ date, expected }) => {
        const result = formatDateTime(date);
        expect(result.date).toContain(expected);
      });
    });

    it("should handle midnight correctly", () => {
      const date = new Date("2024-01-01T00:00:00");
      const result = formatDateTime(date);

      expect(result.time).toBe("00:00");
    });

    it("should handle end of day correctly", () => {
      const date = new Date("2024-01-01T23:59:00");
      const result = formatDateTime(date);

      expect(result.time).toBe("23:59");
    });

    it("should format day of month correctly", () => {
      const date1 = new Date("2024-01-01T12:00:00");
      const date2 = new Date("2024-01-31T12:00:00");

      const result1 = formatDateTime(date1);
      const result2 = formatDateTime(date2);

      expect(result1.date).toBe("MON, JAN 1");
      expect(result2.date).toBe("WED, JAN 31");
    });

    it("should return an object with date and time properties", () => {
      const date = new Date("2024-06-15T18:45:00");
      const result = formatDateTime(date);

      expect(result).toHaveProperty("date");
      expect(result).toHaveProperty("time");
      expect(typeof result.date).toBe("string");
      expect(typeof result.time).toBe("string");
    });
  });
});
