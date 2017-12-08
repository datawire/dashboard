#!/usr/bin/python

import sys

import os
import time

import requests

from flask import Flask

app = Flask(__name__)

START = time.time()

def elapsed():
    running = time.time() - START
    minutes, seconds = divmod(running, 60)
    hours, minutes = divmod(minutes, 60)
    return "%d:%02d:%02d" % (hours, minutes, seconds)

@app.route('/')
def root():
    msgurl = os.environ.get("MESSAGEURL")
    response = requests.get(msgurl)
    msg = "no message??"

    if response.status_code == 200:
        msg = response.text
    else:
        msg = "oh dear (%d)" % response.status_code

    return "Demo #66 - %s! (up %s, %s)\n" % (msg, elapsed(), os.environ["BUILD_PROFILE"])

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)
