import { knativebus } from 'index'

jest.mock('axios')

describe('knativebus', () => {

  describe('send', () => {

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should expose a send function once initialized', () => {
      const bus = knativebus({})

      expect(bus.send).toBeDefined()
      expect(typeof bus.send === 'function').toBe(true)
    })

    it('send without broker', async () => {
      const bus = knativebus({
        brokers: {
        },
        source: 'knativebus-tests'
      })

      const axios = require('axios')

      const command = 'example-aggregate.execute'
      const data = { id: 1 }

      try {
        await bus.send(command, data)
      } catch (e) {
        expect(e).toEqual(new Error('broker url has not been configured for example-aggregate'))
      }
      expect(axios).not.toBeCalled()
    })

    it('send invalid command', async () => {
      const exampleAggregateModelBroker = 'http://broker-ingress.knative-eventing.svc.cluster.local/test/example-aggregate-model'
      const bus = knativebus({
        brokers: {
          'example-aggregate': exampleAggregateModelBroker
        },
        source: 'knativebus-tests'
      })

      const axios = require('axios')

      const command = 'execute'
      const data = { id: 1 }

      try {
        await bus.send(command, data)
      } catch (e) {
        expect(e).toEqual(new Error('format commands as {aggregate}.{command}'))
      }
      expect(axios).not.toBeCalled()
    })

    it('send', async () => {
      const exampleAggregateModelBroker = 'http://broker-ingress.knative-eventing.svc.cluster.local/test/example-aggregate-model'
      const bus = knativebus({
        brokers: {
          'example-aggregate': exampleAggregateModelBroker
        },
        source: 'knativebus-tests'
      })

      const axios = require('axios')

      const command = 'example-aggregate.execute'
      const data = { id: 1 }

      await bus.send(command, data)
      expect(axios).toBeCalledWith({
        method: 'post',
        url: exampleAggregateModelBroker,
        data: JSON.stringify(data),
        headers: expect.any(Object)
      })
    })
  })

  describe('publish', () => {

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should expose a publish function once initialized', () => {
      const bus = knativebus({})
  
      expect(bus.publish).toBeDefined()
      expect(typeof bus.publish === 'function').toBe(true)
    })

    it('publish invalid command', async () => {
      const exampleAggregateModelBroker = 'http://broker-ingress.knative-eventing.svc.cluster.local/test/example-aggregate-model'
      const bus = knativebus({
        brokers: {
          'example-aggregate': exampleAggregateModelBroker
        },
        source: 'knativebus-tests'
      })

      const axios = require('axios')

      const command = 'executed'
      const data = { id: 1 }

      try {
        await bus.publish(command, data)
      } catch (e) {
        expect(e).toEqual(new Error('format events as {aggregate}.{event-happened}'))
      }
      expect(axios).not.toBeCalled()
    })

    it('publish without channel', () => {
      const bus = knativebus({
        channels: {
        },
        source: 'example-aggregate-model-tests'
      })
  
      const axios = require('axios')
  
      const event = 'example-aggregate.event-happened'
      const data = { id: 1 }
  
      try {
        bus.publish(event, data)
      } catch (e) {
        expect(e).toEqual(new Error(`channel url has not been configured for example-aggregate`))
      }
      expect(axios).not.toBeCalled()
    })
  
    it('publish', () => {
      const domainEvents = 'http://example-aggregate-domain-events-kn-channel.default.svc.cluster.local'
      const bus = knativebus({
        channels: {
          'example-aggregate': domainEvents
        },
        source: 'example-aggregate-model-tests'
      })
  
      const axios = require('axios')
  
      const event = 'example-aggregate.event-happened'
      const data = { id: 1 }
  
      bus.publish(event, data)
      expect(axios).toBeCalledWith({
        method: 'post',
        url: domainEvents,
        data: JSON.stringify(data),
        headers: expect.any(Object)
      })
    })
  })
})
