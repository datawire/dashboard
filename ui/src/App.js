import React, { Component } from 'react';
import logo from './jetpack.svg';
import './App.css';

import 'semantic-ui-css/semantic.min.css';
import { Card, Grid, Image, Table } from 'semantic-ui-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

class Metrics extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      "created": {},
      "closed": {},
      "releases": {}
    }
  }

  componentDidMount() {
    fetch("/api/metrics", {credentials: "same-origin"}).then(response => response.json()).then(data => {
      this.setState(prev => data);
    }).catch(error => {
      console.log(error);
    });
  }

  render() {
    var data = [];

    var title = this.props.title;
    var project = this.props.project;

    var created = this.state.created["datawire/" + project];
    var closed = this.state.closed["datawire/" + project];
    var releases = this.state.releases[project];

    if (created && closed && releases) {
      for (var wn = 49; wn > 0; wn--) {
        var item = {
          "name": "Week " + wn,
          "opened": (wn in created) ? created[wn].length : 0,
          "closed": (wn in closed) ? closed[wn].length : 0,
          "releases": (wn in releases) ? releases[wn].length : 0
        };
        data.unshift(item);
        if (data.length > 12) {
          break;
        }
      }
    }

    return (
      <div>
        <h1>{title}</h1>
        <ResponsiveContainer width="100%" height={200} >
        <BarChart data={data} barGap="0" margin={{top: 5, right: 30, left: 20, bottom: 5}}>
          <XAxis dataKey="name"/>
          <YAxis/>
          <CartesianGrid strokeDasharray="3 3"/>
          <Tooltip/>
          <Legend />
          <Bar dataKey="opened" fill="#aa0000" />
          <Bar dataKey="closed" fill="#00aa00" />
          <Bar dataKey="releases" fill="#0000aa" />
        </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
}

class Meter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      "profile": "stable",
      "routes": {}
    }
    this.active = false;
  }

  componentDidMount() {
    this.active = true;
    this.poll();
  }

  componentWillUnmount() {
    this.active = false;
  }

  poll() {
    fetch("/api/meter", {credentials: "same-origin"}).then(response => response.json()).then(data => {
      this.setState(prev => data);
      if (this.active) {
        setTimeout(() => this.poll(), 1000);
      }
    }).catch(error => {
      console.log(error);
      if (this.active) {
        setTimeout(() => this.poll(), 1000);
      }
    });
  }

  render() {
    var rows = [];
    var keys = Object.keys(this.state.routes);
    keys.sort();

    for (var i = 0; i < keys.length; i++) {
      var route = this.state.routes[keys[i]];
      var clusters = route.clusters;
      var ckeys = Object.keys(clusters);
      ckeys.sort();
      for (var j = 0; j < ckeys.length; j++) {
        var cluster = clusters[ckeys[j]];
        rows.push(
          <Table.Row>
            <Table.Cell>{keys[i]}</Table.Cell>
            <Table.Cell>{ckeys[j]}</Table.Cell>
            <Table.Cell>{cluster.weight}</Table.Cell>
            <Table.Cell>{cluster.count}</Table.Cell>
          </Table.Row>
        );
      }
    }

    return (
  <Table striped>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>URL</Table.HeaderCell>
        <Table.HeaderCell>Cluster</Table.HeaderCell>
        <Table.HeaderCell>Weight</Table.HeaderCell>
        <Table.HeaderCell>Count</Table.HeaderCell>
      </Table.Row>
    </Table.Header>

    <Table.Body>{rows}</Table.Body>
  </Table>
    );
  }
}

class Poller extends React.Component {
  constructor(props) {
    super(props);
    this.state = { responses: [] }
    this.active = false;
  }

  componentDidMount() {
    this.active = true;
    this.poll();
  }

  componentWillUnmount() {
    this.active = false;
  }

  poll() {
    var start = new Date().getTime();
    fetch(this.props.endpoint, {credentials: "same-origin"}).then(response => response.text()).then(text => {
      this.setState(prev => {
        var now = new Date().getTime();
        var elapsed = now - start;
        var responses = prev.responses.concat([{latency: elapsed, body: text}]);
        var n = responses.length;
        var max = 1000;
        if (n > max) {
          responses = responses.slice(n - max, n);
        }
        return { responses: responses }
      })
      if (this.active) {
        setTimeout(() => this.poll(), 1000);
      }
    });
  }

  latency(responses, profile) {
    var sum = 0;
    var count = 0;
    for (var j = 0; j < responses.length; j++) {
      var response = responses[j];
      if (response.body.indexOf(profile) != -1) {
        sum += response.latency;
        count += 1;
      }
    }
    if (count) {
      var avg = (sum/count).toFixed(2);
      return avg;
    } else {
      return "-"
    }
  }

  render() {
    var items = [];
    for (var i = this.state.responses.length - 1; i >= 0; i--) {
      items.push(<p>{this.state.responses[i].body}</p>);
      if (items.length > 2) {
        break;
      }
    }

    var stable = this.latency(this.state.responses, "stable");
    var canary = this.latency(this.state.responses, "canary");

    return (
        <Card centered>
          <Card.Content header>{this.props.endpoint}</Card.Content>
          <Card.Content description>{items}</Card.Content>
          <Card.Content extra>latency: {stable}, {canary}</Card.Content>
        </Card>
    );
  }
}

const GridExampleCelled = () => (
  <Grid celled columns={15}>
    <Grid.Row>
      <Grid.Column width={5}>
        <Metrics title="Ambassador" project="ambassador"/>
      </Grid.Column>
      <Grid.Column width={5}>
        <Metrics title="Forge" project="forge"/>
      </Grid.Column>
      <Grid.Column width={5}>
        <Metrics title="Telepresence" project="telepresence"/>
      </Grid.Column>
    </Grid.Row>

    <Grid.Row>
      <Grid.Column width={10}>
        <Meter/>
      </Grid.Column>
      <Grid.Column width={5}>
        <Poller endpoint="api"/>
      </Grid.Column>
    </Grid.Row>
  </Grid>
)

class App extends Component {
  render() {
    return (
      <div className="app">
        <div style={{height: "60px"}}/>
        <Image className="logo" centered size="small" src={logo} />
        <div style={{height: "60px"}}/>
        <div style={{width: "90%", margin: "0 auto"}}>
          <GridExampleCelled/>
        </div>
      </div>
    );
  }
}

export default App;
