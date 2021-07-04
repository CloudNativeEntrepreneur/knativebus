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
  name: example-aggregate
```

### Channel

This is configured to use an InMemory Channel. You'll want to use Kafka for production - see the KNative Docs for details.

#### CQRS/ES

Create a channel to publish domain events about your aggregate:

```yaml
apiVersion: messaging.knative.dev/v1
kind: Channel
metadata:
  name: example-aggregate-domain-events
```

### Node.js

Then in Node.js, you can use `knativebus` to `publish` events and `send` commands to these brokers and channels by providing a configuration object with the URLs they generate by aggregate name.

```javascript
import { knativebus } from 'knativebus'

const exampleAggregateBroker = process.env.KNATIVE_EXAMPLE_AGGREGATE_BROKER || 'http://broker-ingress.knative-eventing.svc.cluster.local/test/example-aggregate-model'
const exampleAggregateDomainEventsChannel = process.env.KNATIVE_EXAMPLE_AGGREGATE_DOMAIN_EVENTS_CHANNEL || 'http://example-aggregate-domain-events-kn-channel.default.svc.cluster.local'

const bus = knativebus({
  brokers: {
    'example-aggregate': exampleAggregateBroker
  },
  channels: {
    'example-aggregate': exampleAggregateDomainEventsChannel
  },
  source: 'the-name-of-the-service-sending-this-event'
})

const run = async () => {
  // send command to example-aggregate model broker
  await bus.send('example-aggregate.initialize', { id: 1, name: 'Example 1' })

  // or publish events (past tense) to a model's event channel
  await bus.publish('example-aggregate.initialized', { id: 1, name: 'Example 1' })
}

run()
```