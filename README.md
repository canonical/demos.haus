# demos.haus

[![CircleCI build status](https://circleci.com/gh/canonical-web-and-design/demos.haus.svg?style=shield)](https://circleci.com/gh/canonical-web-and-design/demos.haus) [![Code coverage](https://codecov.io/gh/canonical-web-and-design/demos.haus/branch/master/graph/badge.svg)](https://codecov.io/gh/canonical-web-and-design/demos.haus)

## Getting it running

I couldn't get this running with dotrun, because the dependencies on `kubectl` etc. are too difficult to integrate successfully.

You'll need the following secrets:

- Jenkins
- Github access token
- Github webhook secret

You'll also need access to the demo cluster. Hopefully you might have secrets in [your enigma](https://enigma.admin.canonical.com/). You'll need to merge these credentials into your `~/.kube/config` file, and then also using `kubectl config use-context` to switch to the right context.

The only way I could get this running was by manually setting up both the Python version and the Python environment.

This first required me to install PyEnv, to get the right Python version (it won't work with Python>=3.10).

- https://github.com/pyenv/pyenv-installer

Once it's installed, get Python 3.9:

```bash
pyenv install 3.9.13
pyenv local 3.9.13
```

Setup the Python environment:

```bash
python3 -m venv env3
source env3/bin/activate
pip3 install -U setuptools
pip3 install -r requirements.txt
```

Then run the project - replace all `{SOMETHING}` variables:

```bash
SECRET_KEY=whatever GITHUB_WEBHOOK_SECRET={WEBHOOK_SECRET} GITHUB_ACCESS_TOKEN={GITHUB_TOKEN} JENKINS_TOKEN={JENKINS_TOKEN} JENKINS_URL=https://jenkins.canonical.com/webteam KUBECONFIG=~/.kube/config ./entrypoint 0.0.0.0:8100
```

If you only intend to make modifications affecting the kubernetes pods, the following should work

```bash
KUBECONFIG=~/.kube/config ./entrypoint 0.0.0.0:8100
```
