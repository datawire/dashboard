#!/usr/bin/python

import os, sys, time
import random
from flask import Flask
app = Flask(__name__)

sys.path.append("/config")

import config

goals = [
  "Document Ambassador working with Istio.",
  "Ship Forge 0.3.21 with fixes for customer Y.",
  "Improve the speed of Telepresence tests."
]

START = time.time()

def elapsed():
    running = time.time() - START
    minutes, seconds = divmod(running, 60)
    hours, minutes = divmod(minutes, 60)
    return "%d:%02d:%02d" % (hours, minutes, seconds)

@app.route('/')
def root():
    # time.sleep(0.5)
    return random.choice(goals)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)
