#!/usr/bin/python

import os, sys, time
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
    return "Demo #23! (up %s, %s)\n" % (elapsed(), os.environ["BUILD_PROFILE"])

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)
