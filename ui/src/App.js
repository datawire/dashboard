import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import 'semantic-ui-css/semantic.min.css';
import { Grid } from 'semantic-ui-react'

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
    fetch(this.props.endpoint, {credentials: "same-origin"}).then(response => response.text()).then(text => {
      this.setState(prev => {
        var responses = prev.responses.concat([text]);
        var n = responses.length;
        var max = 3;
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

  render() {
    var items = [];
    for (var i = 0 ; i < this.state.responses.length; i++) {
      items.push(<p>{this.state.responses[i]}</p>);
    }
    return (
        <ul>{items}</ul>
    );
  }
}

const GridExampleCelled = () => (
  <Grid celled>
    <Grid.Row>
      <Grid.Column width={3}>
        Average service latency
      </Grid.Column>
      <Grid.Column width={13}>
        Number of open GitHub issues:
        <Poller endpoint="issues"/>
      </Grid.Column>
    </Grid.Row>

    <Grid.Row>
      <Grid.Column width={3}>
        <Poller endpoint="updates"/>
      </Grid.Column>
      <Grid.Column width={10}>
        <Poller endpoint="api"/>
      </Grid.Column>
      <Grid.Column width={3}>
        <p>This is a test.</p>
      </Grid.Column>
    </Grid.Row>
  </Grid>
)

class App extends Component {
  render() {
    return (
      <div className="app">
        <div style={{height: "60px"}}/>
        <h1 className="title">Twitface</h1>
        <div style={{height: "60px"}}/>
        <div style={{width: "90%", margin: "0 auto"}}>
          <GridExampleCelled/>
        </div>
      </div>
    );
  }
}

export default App;
