import hmac
import os
import requests
from hashlib import sha1

import flask
from canonicalwebteam.flask_base.app import FlaskBase
from github3 import login

from webapp.k8s import (
    get_running_demos,
    get_deployment_status,
    get_deployment_logs,
    filter_demos_by_name,
    update_pod_state,
)
from webapp.sso import init_sso, login_required

# Get required values from env or fail
JENKINS_URL = os.environ["JENKINS_URL"]
JENKINS_PUBLIC_URL = os.environ["JENKINS_PUBLIC_URL"]
JENKINS_TOKEN = os.environ["JENKINS_TOKEN"]
GITHUB_ACCESS_TOKEN = os.environ["GITHUB_ACCESS_TOKEN"]
GITHUB_WEBHOOK_SECRET = os.environ["GITHUB_WEBHOOK_SECRET"]

# Create GitHub client
ghub = login(token=GITHUB_ACCESS_TOKEN)

app = FlaskBase(
    __name__,
    "demos.haus",
    template_folder="../templates",
    static_folder="../static",
    template_404="404.html",
    template_500="500.html",
)

init_sso(app)


def get_jenkins_job(action):
    # To be changed after QA
    return {
        "opened": "webteam/job/start-demo-test",
        "synchronize": "webteam/job/start-demo-test",
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
@login_required
def index():
    return flask.render_template("index.html")


@app.route("/hook/gh", methods=["POST"])
def github_demo_webhook():
    if not validate_github_webhook_signature(
        flask.request.data, flask.request.headers.get("X-Hub-Signature")
    ):
        return flask.jsonify({"message": "Invalid secret"}, 403)

    # Say hi to github when we do the initial setup.
    if flask.request.headers.get("X-GitHub-Event") == "ping":
        return flask.jsonify({"message": "Hi Github!"}, 200)

    payload = flask.request.json
    action = payload["action"]
    pull_request = payload["number"]
    pull_request_url = payload["pull_request"]["html_url"]
    repo_owner = payload["repository"]["owner"]["login"]
    repo_name = payload["repository"]["name"]
    author = payload["sender"]["login"]

    issue = ghub.issue(repo_owner, repo_name, pull_request)
    repo = ghub.repository(repo_owner, repo_name)

    # Only trigger builds if PR author is a collaborator
    allowed_bots = ["renovate[bot]", "dependabot[bot]", "github-actions[bot]"]
    allowed = author in allowed_bots or repo.is_collaborator(author)

    if not allowed:
        message = f"{author} is not a collaborator of the repo"

        # If the PR was opened post the error message
        if action == "opened":
            issue.create_comment(message)

        return flask.jsonify({"message": message}, 403)

    # Check if the db should be deleted
    keepdb = False
    for label in payload["pull_request"]["labels"]:
        if label["name"] == "keepdb":
            keepdb = True
            break

    # Work out the remote build url
    try:
        jenkins_job = get_jenkins_job(action)
    except KeyError:
        return (
            flask.jsonify({"message": f"No job for PR action: {action}"}),
            200,
        )

    jenkins_job_params = (
        f"token={JENKINS_TOKEN}&PR_URL={pull_request_url}&KEEP_DB={keepdb}"
    )
    remote_build_url = f"http://{JENKINS_URL}/{jenkins_job}/buildWithParameters?{jenkins_job_params}"
    job_id = ""

    # Trigger the build in jenkins
    if not app.debug:
        response = requests.get(remote_build_url)
        response.raise_for_status()
        # Get the id of the demo
        job_id = response.headers.get("Location").split("/")[-2]
    else:
        # In debug mode just print the URL
        app.logger.info(remote_build_url)
        app.logger.info(job_id)

    # If the PR was opened post the the link to the demo
    if action == "opened":
        demo_url = (
            f"https://{repo_name.replace('.', '-')}-{pull_request}.demos.haus"
        )
        jenkins_url = f"{JENKINS_PUBLIC_URL}/{jenkins_job}/{job_id}"

        comment = f"### [<img src='https://assets.ubuntu.com/v1/6baef514-ubuntu-circle-of-friends-large.svg' height=32 width=32> Demo</img>]({demo_url})\n"
        comment += f"### [<img src='https://assets.ubuntu.com/v1/e512b0e2-jenkins.svg' height=32 width=32> Jenkins </img>]({jenkins_url})\n"
        comment += "### [<img src='https://assets.ubuntu.com/v1/7144ec6d-logo-jaas-icon.svg' height=32 width=32> demos.haus </img>](https://demos.haus)\n"

        issue.create_comment(comment)

    return flask.jsonify({"message": "Webhook handled"}, 200)


@app.route("/demos", methods=["GET"])
@login_required
def demos():
    return flask.jsonify(get_running_demos())


@app.route("/demo/search")
@login_required
def search():
    query = flask.request.args.get("query")
    demos = get_running_demos()
    if query:
        demos = filter_demos_by_name(demos, query)
    return flask.jsonify(demos)


@app.route("/demo/status", methods=["GET"])
@login_required
def demo_status():
    pod_name = flask.request.args.get("name")
    return flask.jsonify(get_deployment_status(pod_name))


@app.route("/demo/update", methods=["GET"])
@login_required
def update_demo():
    state = flask.request.args.get("state")
    pod_name = flask.request.args.get("name")
    update_pod_state(state, pod_name)
    return flask.jsonify({"message": "Pod state updated", "state": state})


@app.route("/demo/logs/complete", methods=["GET"])
@login_required
def get_logs_page():
    pod_name = flask.request.args.get("name")
    logs = get_deployment_logs(pod_name)
    return flask.render_template("logs.html", logs=logs, name=pod_name)


@app.route("/demo/logs", methods=["GET"])
@login_required
def get_logs():
    pod_name = flask.request.args.get("name")
    logs = get_deployment_logs(pod_name)
    return flask.jsonify({"message": "success", "logs": logs})
