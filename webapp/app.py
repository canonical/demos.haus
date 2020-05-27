import flask
import os
import hmac 
import requests
from hashlib import sha1

from canonicalwebteam.flask_base.app import FlaskBase
from flask import render_template


JENKINS_URL = os.environ["JENKINS_URL"]
JENKINS_TOKEN = os.environ["JENKINS_TOKEN"]
GITHUB_WEBHOOK_SECRET = os.environ["GITHUB_WEBHOOK_SECRET"]

# Rename your project below
app = FlaskBase(
    __name__,
    "k8s.demo.haus",
    template_folder="../templates",
    static_folder="../static",
    template_404="404.html",
    template_500="500.html",
)


def get_jenkins_job(action):
    return {
        "opened": "webteam/job/start-demo",
        "synchronize": "webteam/job/start-demo",
        "closed": "webteam/job/stop-demo",
    }[action]


def validate_github_webhook_signature(payload, signature):
    """
    Generate the payload signature and compare with the given one
    """
    key = bytes(GITHUB_WEBHOOK_SECRET, "UTF-8")
    hmac_gen = hmac.new(key, payload, sha1)

    # Add append prefix to match the GitHub request format
    digest = f"sha1={hmac_gen.hexdigest()}"

    return hmac.compare_digest(digest, signature)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/hook/gh", methods = ['POST'])
def github_demo_webhook():
    if not validate_github_webhook_signature(
        flask.request.data, flask.request.headers.get("X-Hub-Signature")
    ):
        return flask.jsonify({"messages": "Invalid secret"}, 403)

    payload = flask.request.json
    action = payload["action"]
    pull_request = payload["number"]
    repo_owner = payload["repository"]["owner"]["login"]
    repo_name = payload["repository"]["name"]
    sender = payload["sender"]["login"]
    jenkins_job = get_jenkins_job(action)
    jenkins_job_params = f"token={JENKINS_TOKEN}&REPO={repo_name}&PR={pull_request}"

    remote_build_url = f"http://{JENKINS_URL}/{jenkins_job}/buildWithParameters?{jenkins_job_params}"
    response = requests.get(remote_build_url)
    
    return flask.jsonify({"messages": "Webhook handled"}, 200)
