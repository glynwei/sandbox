describe("hydration success", () => {
  let spyError: ReturnType<Cypress.Chainable["spy"]>;
  let spyWarn: ReturnType<Cypress.Chainable["spy"]>;

  beforeEach(() => {
    spyError = cy.spy(window.console, "error");
    spyWarn = cy.spy(window.console, "warn");
  });

  afterEach(() => {
    expect(spyError).not.to.be.called;
    expect(spyWarn).not.to.be.called;
  });

  it("passes", () => {
    cy.visit("http://localhost:8080");

    const links = [
      { url: "http://localhost:8080/", testId: "reload-index" },
      { url: "http://localhost:8080/overfetch", testId: "reload-overfetch" },
      { url: "http://localhost:8080/underfetch", testId: "reload-underfetch" },
      { url: "http://localhost:8080/", testId: "next-index" },
      { url: "http://localhost:8080/overfetch", testId: "next-overfetch" },
      { url: "http://localhost:8080/underfetch", testId: "next-underfetch" },
    ];

    for (let ii = 0; ii < links.length; ii++) {
      const { url: url1, testId: testId1 } = links[ii];
      for (let jj = ii; jj < links.length; jj++) {
        const { url: url2, testId: testId2 } = links[jj];
        cy.wait(750); // if we don't wait, the clicks cancel previous loads
        cy.get(`[data-test-id=${testId1}]`).click();
        cy.url().should("equal", url1);

        cy.wait(750);
        cy.get(`[data-test-id=${testId2}]`).click();
        cy.url().should("equal", url2);
      }

      cy.wait(750);
      cy.get(`[data-test-id=${testId1}]`).click();
      cy.url().should("equal", url1);
    }
  });
});

export {};
