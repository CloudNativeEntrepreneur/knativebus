# knativebus

Publish and Send events to KNative via wrapping them in CloudEvents and sending via HTTP Post to the appropriate broker or channel from the config.

## Usage

Create Brokers and Channels via KNative Eventing CRDs in Kubernetes:

### Broker

This is configured to use an InMemory Broker. You'll want to use Kafka for production - see the KNative Docs for details.

#### CQRS/ES

Create a broker to send commands to for your aggregate:

```yaml
apiVersion: eventing.knative.dev/v1
kind: Broker
metadata:
  name: example-commands
```

And a broker to publish domain events about your aggregate:

```yaml
apiVersion: messaging.knative.dev/v1
kind: Broker
metadata:
  name: example-events
```

### Node.js

Then in Node.js, you can use `knativebus` to `publish` events and `send` commands to these brokers by providing a configuration object with the URLs they generate by aggregate name.

```javascript
import { knativebus } from 'knativebus'

const bus = knativebus({
  aggregates: {
    example: {
      commands: 'http://broker-ingress.knative-eventing.svc.cluster.local/default/example-commands',
      events: 'http://broker-ingress.knative-eventing.svc.cluster.local/default/example-events'
    }
  },
  source: 'tests',
  retry: true,
  timeout: 30 * 1000
})

const run = async () => {
  // send command to example commands broker
  await bus.send('example.initialize', { id: 1, name: 'Example 1' })

  // or publish events (past tense) to a model's events broker
  await bus.publish('example.initialized', { id: 1, name: 'Example 1' })
}

run()
```

# register-server-handlers

This library works well in conjuction with [register-server-handlers](https://github.com/CloudNativeEntrepreneur/register-server-handlers) for building event driven CQRS/ES microservice systems with KNative.
