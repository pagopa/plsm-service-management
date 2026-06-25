import * as appInsights from 'applicationinsights'

export const initAppInight = (
  connectionString: string,
  configAppInsight?: {
    sampleRate?: number
    disableAppInsights?: boolean
  }
): appInsights.TelemetryClient => {
  const ai = appInsights.setup(connectionString)

  ai.setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true, false)
    .setAutoCollectPreAggregatedMetrics(true)
    .setSendLiveMetrics(false)
    .setInternalLogging(false, true)
    .enableWebInstrumentation(false)
    .start()

  const config = appInsights.defaultClient.config

  config.samplingPercentage =
    configAppInsight?.sampleRate ?? config.samplingPercentage

  config.disableAppInsights =
    configAppInsight?.disableAppInsights ?? config.disableAppInsights

  return appInsights.defaultClient
}
