# Monitoring the Envoy Proxy on Kubernetes with Prometheus

## Introduction

In the Kubernetes ecosystem, one of the emerging themes is how applications can best take advantage of the various capabilities of Kubernetes. The Kubernetes community has also introduced new concepts such as [Custom Resources](https://kubernetes.io/docs/concepts/api-extension/custom-resources/) to make it easier to build Kubernetes-native software.

In late 2016, CoreOS introduced the [Operator pattern](https://coreos.com/blog/introducing-operators.html), and as a working example of the pattern released the [Prometheus Operator](https://coreos.com/operators/prometheus/docs/latest/). The Prometheus Operator automatically creates and manages Prometheus monitoring instances.

The operator model is especially powerful for cloud-native organizations deploying multiple services. In this model, each team can deploy their own Prometheus instance as necessary, instead of relying on a central SRE team to implement monitoring.

## Envoy, Ambassador, and Prometheus

In this tutorial, we'll show how the Prometheus Operator can be used to monitor an Envoy proxy deployed at the edge. Envoy is an open source L7 proxy. One of the reasons for Envoy's growing popularity is its emphasis on observability. Envoy uses [statsd as its output format](https://www.envoyproxy.io/docs/envoy/v1.5.0/intro/arch_overview/statistics.html).

Instead of using Envoy directly, we'll use [Ambassador](https://www.getambassador.io). Ambassador is a Kubernetes-native API Gateway built on Envoy. Similar to the Prometheus Operator, Ambassador configures and manages Envoy instances in Kubernetes, so that the end user doesn't need to do that work directly.

## Prerequisites

This tutorial assumes you're running Kubernetes 1.8 or later, with RBAC enabled.

Note: If you're running on Google Kubernetes Engine, you'll need to grant `cluster-admin` privileges to the account that will be installing Prometheus and Ambassador. You can do this with the commands below:

```
$ gcloud info | grep Account
Account: [username@example.org]
$ kubectl create clusterrolebinding my-cluster-admin-binding --clusterrole=cluster-admin --user=username@example.org
```

## Deploy the Prometheus Operator

The Prometheus Operator is configured as a Kubernetes `deployment`. We'll also want to create two different `ServiceAccount`s: one for the operator, and one for the actual Prometheus instances:

```
kubectl apply -f prom-operator.yaml
kubectl apply -f prom-rbac.yaml
```

The Operator functions as your virtual SRE. At all times, the Prometheus operator insures that you have a set of Prometheus servers running with the appropriate configuration.

## Deploy Ambassador

Ambassador also functions as your virtual SRE. At all times, Ambassador insures that you have a set of Envoy proxies running the appropriate configuration.

We're going to deploy Ambassador into Kubernetes. On each Ambassador pod, we'll also deploy an additional container that runs the [Prometheus statsd exporter](https://github.com/prometheus/statsd_exporter). The exporter will collect the statsd metrics emitted by Envoy over UDP, and proxy them to Prometheus over TCP in Prometheus metrics format.

`kubectl apply -f ambassador-rbac.yaml`

Ambassador is typically deployed as an API Gateway at the edge of your network. We'll deploy a service to map to the Ambassador `deployment`. Note: if you're not on AWS or GKE, you'll need to update the service below to be a `NodePort` instead of a `LoadBalancer`.

`kubectl apply -f ambassador.yaml`

## Configure Prometheus

We now have Ambassador/Envoy running, along with the Prometheus Operator. How do we hook this all together? Logically, all the metrics data flows from Envoy to Prometheus in the following way:

```
Envoy -> StatsD Exporter -> StatsD Service -> ServiceMonitor -> Prometheus
```

So far, we've deployed Envoy and the StatsD exporter, so now it's time to deploy the other components of this flow.

1. We'll create a Kubernetes `service` that points to the StatsD exporter. We'll then create a `ServiceMonitor` that tells Prometheus to add the service as a target:

`kubectl apply -f statsd-sink-svc.yaml`

2. Next, we need to tell the Prometheus Operator to create a Prometheus cluster for us. The Prometheus cluster is configured to collect data from any `ServiceMonitor` with the `ambassador:monitoring` label.

`kubectl apply -f prometheus.yaml`

3. Finally, we can create a service to expose Prometheus to the rest of the world. Again, if you're not on AWS or GKE, you'll want to use a `NodePort` instead.

`kubectl apply -f prom-svc.yaml`

## Testing

We've now configured Prometheus to monitor Envoy, so now let's test this out.

1. Get the external IP address for Prometheus.

```
$ kubectl get services
NAME                  CLUSTER-IP      EXTERNAL-IP      PORT(S)          AGE
ambassador            10.11.255.93    35.221.115.102   80:32079/TCP     3h
ambassador-admin      10.11.246.117   <nodes>          8877:30366/TCP   3h
ambassador-monitor    None            <none>           9102/TCP         3h
kubernetes            10.11.240.1     <none>           443/TCP          3h
prometheus            10.11.254.180   35.191.39.173    9090:32134/TCP   3h
prometheus-operated   None            <none>           9090/TCP         3h
```

In the example above, this is `35.191.39.173`.

2. Go to http://$PROM_IP:9090 to see the Prometheus UI. You should see a number of metrics automatically populate in Prometheus.

### Troubleshooting

If the above doesn't work, there are a few things to investigate:

* Make sure all your pods are running (`kubectl get pods`)
* Check the logs on the Prometheus cluster (`kubectl logs $PROM_POD prometheus`)
* Check [Ambassador diagnostics](https://www.getambassador.io/user-guide/running#diagnostics) to verify Ambassador is working correctly

## Get a service running in Envoy

The metrics so far haven't been very interesting, since we haven't routed any traffic through Envoy. We'll use Ambassador to set up a route from Envoy to the [httpbin](http://httpbin.org) service. Ambassador is configured using Kubernetes annotations, so we'll do that here.

```
kubectl apply -f httpbin.yaml
```

Now, if we get the external IP address of Ambassador, we can route requests through Ambassador to the httpbin service:

```
$ kubectl get services
NAME                  CLUSTER-IP      EXTERNAL-IP      PORT(S)          AGE
ambassador            10.11.255.93    35.221.115.102   80:32079/TCP     3h
ambassador-admin      10.11.246.117   <nodes>          8877:30366/TCP   3h
ambassador-monitor    None            <none>           9102/TCP         3h
kubernetes            10.11.240.1     <none>           443/TCP          3h
prometheus            10.11.254.180   35.191.39.173    9090:32134/TCP   3h
prometheus-operated   None            <none>           9090/TCP         3h

$ curl http://35.221.115.102/httpbin/ip
{
  "origin": "35.214.10.110"
}
```

Run a `curl` command a few times, as shown above. Going back to the Prometheus dashboard, you'll see that a bevy of new metrics that contain `httpbin` have appeared. Pick any of these metrics to explore further. For more information on Envoy stats, Matt Klein has written a [detailed overview](https://blog.envoyproxy.io/envoy-stats-b65c7f363342) of Envoy's stats architecture.

## Conclusion
