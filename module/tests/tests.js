export function registerTestSuites(quench) {
  quench.registerBatch(
    "Ars-testRolls",
    context => {
      const { describe, it, assert } = context;

      describe("Passing Suite", function() {
        it("Passing Test", function() {
          assert.ok(true);
        });
      });
    },
    { displayName: "ARS : rolls testsuite" }
  );
}
