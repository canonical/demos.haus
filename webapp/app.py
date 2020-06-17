import flask
import os
import hmac 
import requests
from hashlib import sha1

from canonicalwebteam.flask_base.app import FlaskBase
from github3 import login

from webapp.sso import init_sso, login_required

# Get required values from env or fail
JENKINS_URL = os.environ["JENKINS_URL"]
JENKINS_TOKEN = os.environ["JENKINS_TOKEN"]
GITHUB_ACCESS_TOKEN = os.environ["GITHUB_ACCESS_TOKEN"]
GITHUB_WEBHOOK_SECRET = os.environ["GITHUB_WEBHOOK_SECRET"]

# Create GitHub client
ghub = login(token=GITHUB_ACCESS_TOKEN)

app = FlaskBase(
    __name__,
    "k8s.demo.haus",
    template_folder="../templates",
    static_folder="../static",
    template_404="404.html",
    template_500="500.html",
)

init_sso(app)


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
@login_required
def index():
    return flask.render_template("index.html")


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
    author = payload["sender"]["login"]

    issue = ghub.issue(repo_owner, repo_name, pull_request)
    repo = ghub.repository(repo_owner, repo_name)
    # Only trigger builds if PR author is a collaborator
    if not repo.is_collaborator(author):
        message = f"{author} is not a collaborator of the repo"
        flask.jsonify({"messages": message}, 403)

        # If the PR was opened post the error message
        if action == "opened":
            issue.create_comment(message)

    # Work out the remote build utl
    try:
        jenkins_job = get_jenkins_job(action)
    except KeyError:
        return flask.jsonify({"message": f"No job for PR action: {action}"}), 200

    jenkins_job_params = f"token={JENKINS_TOKEN}&REPO={repo_name}&PR={pull_request}"
    remote_build_url = f"http://{JENKINS_URL}/{jenkins_job}/buildWithParameters?{jenkins_job_params}"
    
    # Trigger the build in jenkins
    if not app.debug:
        response = requests.get(remote_build_url)
        response.raise_for_status()
    else:
        # In debug mode just print the URL
        print(remote_build_url)

    # If the PR was opened post the the link to the demo
    if action == "opened":
        domain = f"{repo_name.replace('.', '-')}-{pull_request}.k8s.demo.haus"
        issue.create_comment(f"Demo starting at https://{domain}")

    return flask.jsonify({"messages": "Webhook handled"}, 200)
