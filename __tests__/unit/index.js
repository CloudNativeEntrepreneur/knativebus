import { knativebus } from 'index'

jest.mock('axios')

describe('knativebus', () => {

  describe('send', () => {
    it('should expose a send function once initialized', () => {
      const bus = knativebus({})

      expect(bus.send).toBeDefined()
      expect(typeof bus.send === 'function').toBe(true)
    })

    it('send without broker', async () => {
      const bus = knativebus({
        brokers: {
        },
        source: 'presidio-command-api-tests'
      })

      const axios = require('axios')

      const command = 'company-group.execute'
      const data = { id: 1 }

      try {
        await bus.send(command, data)
      } catch (e) {
        expect(e).toEqual(new Error('broker url has not been configured for company-group'))
      }
      expect(axios).not.toBeCalled()
    })

    it('send invalid command', async () => {
      const companyGroupModelBroker = 'http://broker-ingress.knative-eventing.svc.cluster.local/test/company-group-model'
      const bus = knativebus({
        brokers: {
          'company-group': companyGroupModelBroker
        },
        source: 'presidio-command-api-tests'
      })

      const axios = require('axios')

      const command = 'execute'
      const data = { id: 1 }

      try {
        await bus.send(command, data)
      } catch (e) {
        expect(e).toEqual(new Error('format commands as {broker}.{command}'))
      }
      expect(axios).not.toBeCalled()
    })

    it('send', async () => {
      const companyGroupModelBroker = 'http://broker-ingress.knative-eventing.svc.cluster.local/test/company-group-model'
      const bus = knativebus({
        brokers: {
          'company-group': companyGroupModelBroker
        },
        source: 'presidio-command-api-tests'
      })

      const axios = require('axios')

      const command = 'company-group.execute'
      const data = { id: 1 }

      await bus.send(command, data)
      expect(axios).toBeCalledWith({
        method: 'post',
        url: companyGroupModelBroker,
        data: JSON.stringify(data),
        headers: expect.any(Object)
      })
    })
  })

  describe('publish', () => {
    it('should expose a publish function once initialized', () => {
      const bus = knativebus({})
  
      expect(bus.publish).toBeDefined()
      expect(typeof bus.publish === 'function').toBe(true)
    })
  
    it('publish', () => {
      const domainEvents = 'http://company-domain-events-kn-channel.default.svc.cluster.local'
      const bus = knativebus({
        channels: {
          domainEvents
        },
        source: 'company-model-tests'
      })
  
      const axios = require('axios')
  
      const event = 'event.happened'
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
