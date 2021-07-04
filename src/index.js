import { CloudEvent, HTTP } from 'cloudevents'
import debug from 'debug'
import axios from 'axios'

const info = debug('knativebus')

export const knativebus = (config) => {
  const { 
    brokers,
    channels,
    source, 
  } = config

  return {
    publish: (type, data) => {
      const domainEventsChannel = channels.domainEvents
      info('publishing event', {
        type, data, target: domainEventsChannel
      })

      const ce = new CloudEvent({
        type,
        source,
        data
      })
      const message = HTTP.binary(ce)

      info(`Publishing CloudEvent to KNative domain events channel (${domainEventsChannel}): ${JSON.stringify(ce, null, 2)}`)

      return axios({
        method: 'post',
        url: domainEventsChannel,
        data: message.body,
        headers: message.headers
      })
    },
    send: (type, data) => {
      const splitType = type.split('.')

      if (splitType.length < 2) throw new Error('format commands as {broker}.{command}')

      const model = splitType[0]
      const modelBroker = brokers[model]

      if (!modelBroker) throw new Error(`broker url has not been configured for ${model}`)

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
