import { TelemetryClient } from 'applicationinsights'

interface EventProperties {
  [key: string]: string
}

export const trackEvent =
  (client: TelemetryClient) =>
  (eventName: string, properties?: EventProperties) => {

    client.trackEvent({
      name: eventName,
      properties: { timestamp: Date.now().toString(), ...properties },
    })
  }