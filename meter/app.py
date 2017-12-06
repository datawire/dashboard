#!python

import sys

import os
import requests

from flask import Flask, jsonify
app = Flask(__name__)

ambassador_url = "http://ambassador-admin-stable.argonath:8877/ambassador/v0/diag/?json=true"
prometheus_url = "http://prometheus-stable.prometheus/api/v1/query?query=ambassador_cluster_count"

def fetch(url):
    r = None

    try:
        r = requests.get(url)
    except OSError as e:
        print("requests.get %s failed: %s" % (url, e))
        return None

    if r:
        if r.status_code != 200:
            print("requests.get %s failed: %s" % (url, r.text))
            return None

    return r.json()

def fetch_prometheus(url):
    r = fetch(url)

    if not r:
        return None

    status = r.get('status', 'failed')

    if status != 'success':
        print("prometheus failure for %s: %s" % (url, status))
        return None

    if 'data' not in r:
        print("prometheus missing data for %s" % url)
        return None

    result_type = r['data'].get('resultType', None)

    if result_type != 'vector':
        print("prometheus not vector for %s: %s" % (url, result_type))
        return None

    results = r['data'].get('result', None)

    if results == None:
        print("prometheus missing results for %s" % url)
        return None

    # print("RESULTS: %s" % results)
    return results

@app.route('/')
def root():
    routes_by_prefix = {}
    clusters = {}

    overview = fetch(ambassador_url)

    if 'routes' in overview:
        for route in overview['routes']:
            prefix = route['prefix']

            route_clusters = {}

            for cluster in route['clusters']:
                cluster_name = cluster['name']
                cluster_weight = cluster['weight']

                route_clusters[cluster_name] = cluster_weight

            rinfo = routes_by_prefix.setdefault(prefix, {
                'clusters': {}
            })

            rinfo['clusters'].update(route_clusters)

    results = fetch_prometheus(prometheus_url)

    for result in results:
        metric = result['metric']
        cluster_name = metric['cluster']

        value = result['value']
        timestamp = value[0]

        try:
            count = int(value[1])
        except ValueError:
            print("WTF? not an int: '%s'" % value[1])
            count = None

        if count == None:
            continue

        print("cluster %s count %d" % (cluster_name, count))

        if cluster_name not in clusters:
            clusters[cluster_name] = 0

        clusters[cluster_name] += count

    final = {
        'profile': os.environ.get("BUILD_PROFILE", "none"),
        'routes': {}
    }

    for pfx in routes_by_prefix.keys():
        pfx_info = {
            'clusters': {}
        }

        route_clusters = routes_by_prefix[pfx]['clusters']

        for cluster_name in sorted(route_clusters.keys()):
            if cluster_name in clusters:
                pfx_info['clusters'][cluster_name] = {
                    'weight': route_clusters[cluster_name],
                    'count': clusters[cluster_name]
                }

        final['routes'][pfx] = pfx_info

    return jsonify(final)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)
