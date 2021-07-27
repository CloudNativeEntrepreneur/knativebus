import { CloudEvent, HTTP } from 'cloudevents'
import debug from 'debug'
import { fetch } from './lib/fetch.js'

const info = debug('knativebus')

const postCloudEvent = async (url, { body, headers }) => {
  const fetchResult = await fetch(
    url,
    {
      method: 'POST',
      body,
      headers
    }
  )

  return await fetchResult.json()
}

export const knativebus = (config) => {
  const {
    aggregates,
    source
  } = config

  if (!aggregates) throw new Error('aggregates are required')
  if (Object.keys(aggregates).length === 0) throw new Error('aggregates must contain at least one aggregate key')
  if (!source) throw new Error('source is required (what service is sending this message)')

  return {
    publish: async (type, data) => {
      const splitType = type.split('.')

      if (splitType.length < 2) throw new Error('format events as {aggregate}.{event-happened}')

      const model = splitType[0]
      const modelBusConfig = aggregates[model]
      if (!modelBusConfig) throw new Error(`"${model}" has not been configured`)

      const modelEventsBroker = modelBusConfig.events

      if (!modelEventsBroker) throw new Error(`"${model}" events broker url has not been configured`)
      info('publishing event', {
        type, data, target: modelEventsBroker
      })

      const ce = new CloudEvent({
        type,
        source,
        data
      })
      const message = HTTP.binary(ce)

      info(`Publishing CloudEvent to KNative domain events channel (${modelEventsBroker}): ${JSON.stringify(ce, null, 2)}`)
      info(message)

      return postCloudEvent(modelEventsBroker, message)
    },
    send: async (type, data) => {
      const splitType = type.split('.')

      if (splitType.length < 2) throw new Error('format commands as {aggregate}.{command}')

      const model = splitType[0]
      const modelBusConfig = aggregates[model]
      if (!modelBusConfig) throw new Error(`"${model}" has not been configured`)

      const modelCommandBroker = modelBusConfig.commands

      if (!modelCommandBroker) throw new Error(`"${model}" commands broker url has not been configured`)

      info('publishing command', {
        type, data, target: modelCommandBroker
      })

      const ce = new CloudEvent({
        type,
        source,
        data
      })
      const message = HTTP.binary(ce)

      info(`Sending cloud event to KNative model broker (${modelCommandBroker}): ${JSON.stringify(ce, null, 2)}`)

      return postCloudEvent(modelCommandBroker, message)
    }
  }
}
