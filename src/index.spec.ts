it("logs hello world", async () => {
  let loggedMessage: string;
  global.console.log = message => (loggedMessage = message);
  await import("./index");
  expect(loggedMessage!).toEqual("hello world!");
});
