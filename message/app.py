#!/usr/bin/python

import sys

import os
import random
import time

from flask import Flask
app = Flask(__name__)

START = time.time()

Messages = [
    "Hello, world!",
    "Kilroy was here",
    "Once upon a time..."
]

@app.route('/')
def root():
    return random.choice(Messages)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)
