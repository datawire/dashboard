#!/usr/bin/python

import os, sys, time
from flask import Flask
app = Flask(__name__)

def issues():
    return 5

@app.route('/')
def root():
    return "Issues: %s" % issues()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)
