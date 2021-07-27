import { knativebus } from 'index'

jest.mock('lib/fetch', () => ({
  fetch: jest.fn(() => new Promise((resolve, reject) => {
    return resolve({
      json: jest.fn(() => new Promise((resolve, reject) => {
        return resolve({
          data: {}
        })
      }))
    })
  }))
}))

const testBusConfig = {
  aggregates: {
    example: {
      commands: 'http://broker-ingress.knative-eventing.svc.cluster.local/test/example-commands',
      events: 'http://broker-ingress.knative-eventing.svc.cluster.local/test/example-events'
    }
  },
  source: 'tests'
}

describe('knativebus', () => {
  describe('send', () => {
    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should throw an error if misconfigured', () => {
      try {
        knativebus({})
      } catch (err) {
        expect(err).toEqual(new Error('aggregates are required'))
      }

      try {
        knativebus({
          aggregates: {}
        })
      } catch (err) {
        expect(err).toEqual(new Error('aggregates must contain at least one aggregate key'))
      }

      try {
        knativebus({
          aggregates: {
            example: {
            }
          }
        })
      } catch (err) {
        expect(err).toEqual(new Error('source is required (what service is sending this message)'))
      }

      const bus = knativebus({
        aggregates: {
          example: {
          }
        },
        source: 'tests'
      })
      expect(bus).toBeDefined()
    })

    it('should expose a send function once initialized', () => {
      const bus = knativebus(testBusConfig)

      expect(typeof bus.send === 'function').toBe(true)
    })

    it('should throw an error if trying to send without aggregate commands broker', async () => {
      const bus = knativebus({
        aggregates: {
          example: {
          }
        },
        source: 'tests'
      })

      const command = 'example.execute'
      const data = { id: 1 }

      try {
        await bus.send(command, data)
      } catch (e) {
        expect(e).toEqual(new Error('"example" commands broker url has not been configured'))
      }
    })

    it('send invalid command', async () => {
      const bus = knativebus(testBusConfig)
      const command = 'execute'
      const data = { id: 1 }

      try {
        await bus.send(command, data)
      } catch (e) {
        expect(e).toEqual(new Error('format commands as {aggregate}.{command}'))
      }
    })

    it('throws an error if aggregate has no config', async () => {
      const bus = knativebus(testBusConfig)
      const command = 'turtle.crawl'
      const data = { id: 1 }

      try {
        await bus.send(command, data)
      } catch (err) {
        expect(err).toEqual(new Error('"turtle" has not been configured'))
      }
    })

    it('send', async () => {
      const bus = knativebus(testBusConfig)
      const { fetch } = require('lib/fetch')

      const command = 'example.execute'
      const data = { id: 1 }

      await bus.send(command, data)
      expect(fetch).toBeCalledWith(testBusConfig.aggregates.example.commands, {
        body: JSON.stringify(data),
        method: 'POST',
        headers: {
          'ce-id': expect.any(String),
          'ce-source': 'tests',
          'ce-specversion': '1.0',
          'ce-time': expect.any(String),
          'ce-type': command,
          "content-type": "application/json; charset=utf-8",
        }
      })
    })
  })

  describe('publish', () => {
    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should expose a publish function once initialized', () => {
      const bus = knativebus(testBusConfig)

      expect(typeof bus.publish === 'function').toBe(true)
    })

    it('publish invalid event', async () => {
      const bus = knativebus(testBusConfig)

      const event = 'executed'
      const data = { id: 1 }

      try {
        await bus.publish(event, data)
      } catch (e) {
        expect(e).toEqual(new Error('format events as {aggregate}.{event-happened}'))
      }
    })

    it('should throw an error if trying to send without aggregate events broker', async () => {
      const bus = knativebus({
        aggregates: {
          example: {
          }
        },
        source: 'tests'
      })

      const event = 'example.event-happened'
      const data = { id: 1 }

      try {
        await bus.publish(event, data)
      } catch (e) {
        expect(e).toEqual(new Error('"example" events broker url has not been configured'))
      }
    })

    it('throws an error if aggregate has no config', async () => {
      const bus = knativebus(testBusConfig)
      const event = 'turtle.crawled'
      const data = { id: 1 }

      try {
        await bus.publish(event, data)
      } catch (err) {
        expect(err).toEqual(new Error('"turtle" has not been configured'))
      }
    })

    it('publish', () => {
      const bus = knativebus(testBusConfig)
      const { fetch } = require('lib/fetch')

      const event = 'example.event-happened'
      const data = { id: 1 }

      bus.publish(event, data)

      expect(fetch).toBeCalledWith(testBusConfig.aggregates.example.events, {
        body: JSON.stringify(data),
        method: 'POST',
        headers: {
          'ce-id': expect.any(String),
          'ce-source': 'tests',
          'ce-specversion': '1.0',
          'ce-time': expect.any(String),
          'ce-type': event,
          "content-type": "application/json; charset=utf-8",
        }
      })
    })
  })
})
