const { formatTime } = require("../src/util.js");

it("Works", () => {
  expect(formatTime(120)).toBe("2:00");

  expect(formatTime(145)).toBe("2:25");

  expect(formatTime(29)).toBe("0:29");

  expect(formatTime(1)).toBe("0:01");

  expect(formatTime(3000)).toBe("50:00");

  expect(formatTime(3001)).toBe("50:01");

  expect(formatTime(3103)).toBe("51:43");

  expect(formatTime(3600)).toBe("1:00:00");

  expect(formatTime(3601)).toBe("1:00:01");

  expect(formatTime(4445)).toBe("1:14:05");

  expect(formatTime(86400)).toBe("24:00:00");

  expect(formatTime(88900)).toBe("24:41:40");
});

it("Handles Edge Cases", () => {
  expect(formatTime(0)).toBe("0:00");

  expect(formatTime(999999999)).toBe("277777:46:39");
});
