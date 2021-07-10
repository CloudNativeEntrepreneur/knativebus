import { CloudEvent, HTTP } from 'cloudevents'
import debug from 'debug'
import axios from 'axios'

const info = debug('knativebus')

export const knativebus = (config) => {
  const {
    aggregates,
    source
  } = config

  if (!aggregates) throw new Error('aggregates are required')
  if (Object.keys(aggregates).length === 0) throw new Error('aggregates must contain at least one aggregate key')
  if (!source) throw new Error('source is required (what service is sending this message)')

  return {
    publish: (type, data) => {
      const splitType = type.split('.')

      if (splitType.length < 2) throw new Error('format events as {aggregate}.{event-happened}')

      const model = splitType[0]
      const modelBusConfig = aggregates[model]
      if (!modelBusConfig) throw new Error(`"${model}" has not been configured`)

      const modelDomainEventsChannel = modelBusConfig.events

      if (!modelDomainEventsChannel) throw new Error(`"${model}" events broker url has not been configured`)
      info('publishing event', {
        type, data, target: modelDomainEventsChannel
      })

      const ce = new CloudEvent({
        type,
        source,
        data
      })
      const message = HTTP.binary(ce)

      info(`Publishing CloudEvent to KNative domain events channel (${modelDomainEventsChannel}): ${JSON.stringify(ce, null, 2)}`)

      return axios({
        method: 'post',
        url: modelDomainEventsChannel,
        data: message.body,
        headers: message.headers
      })
    },
    send: (type, data) => {
      const splitType = type.split('.')

      if (splitType.length < 2) throw new Error('format commands as {aggregate}.{command}')

      const model = splitType[0]
      const modelBusConfig = aggregates[model]
      if (!modelBusConfig) throw new Error(`"${model}" has not been configured`)

      const modelBroker = modelBusConfig.commands

      if (!modelBroker) throw new Error(`"${model}" commands broker url has not been configured`)

      info('publishing command', {
        type, data, target: modelBroker
      })

      const ce = new CloudEvent({
        type,
        source,
        data
      })
      const message = HTTP.binary(ce)

      info(`Sending cloud event to KNative model broker (${modelBroker}): ${JSON.stringify(ce, null, 2)}`)

      return axios({
        method: 'post',
        url: modelBroker,
        data: message.body,
        headers: message.headers
      })
    }
  }
}
