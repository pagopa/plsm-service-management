describe("getMonitoringDb", () => {
  const originalUrl = process.env.MONITORING_DATABASE_URL;

  afterEach(() => {
    process.env.MONITORING_DATABASE_URL = originalUrl;
    jest.resetModules();
  });

  it("fallisce con un messaggio esplicito se la variabile non è configurata", () => {
    delete process.env.MONITORING_DATABASE_URL;
    jest.resetModules();

    const { getMonitoringDb } = require("../src/client");

    expect(() => getMonitoringDb()).toThrow(
      "MONITORING_DATABASE_URL is required to access the monitoring database",
    );
  });

  it("riusa la stessa istanza tra chiamate successive", () => {
    process.env.MONITORING_DATABASE_URL =
      "postgresql://localhost:5432/monitoring";
    jest.resetModules();

    const { getMonitoringDb } = require("../src/client");

    expect(getMonitoringDb()).toBe(getMonitoringDb());
  });
});
