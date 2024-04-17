import os
import re
from contextlib import suppress
from datetime import datetime, timezone
from distutils.util import strtobool

from kubernetes import config, client

# Load the config for to use the SDK
in_k8s_cluster = strtobool(os.getenv("IN_K8S_CLUSTER", "False"))
if in_k8s_cluster:
    config.load_incluster_config()
else:
    config.load_kube_config()

api = client.AppsV1Api()
corev1 = client.CoreV1Api()
netv1 = client.NetworkingV1Api()


def get_running_demos():
    deployments = api.list_namespaced_deployment(namespace="default", watch=False)

    demos = []
    for deployment in deployments.items:
        if (
            deployment.metadata.name
            not in [
                "demos-haus",
                "tools-demos-haus",
            ]
            and deployment.metadata.labels
        ):

            demos.append(
                {
                    "name": deployment.metadata.name,
                    "host": f"https://{deployment.metadata.labels.get('app')}",
                    "pr_url": get_pr_url(deployment.metadata.labels),
                    "running_time": get_time_delta(
                        deployment.metadata.creation_timestamp
                    ),
                    "status": get_status(deployment.status.conditions),
                }
            )

    return demos


def get_time_delta(start_time):
    now = datetime.now().replace(tzinfo=timezone.utc)
    seconds = (now - start_time).seconds

    minutes = seconds // 60
    hours = seconds // 3600
    days = seconds // 86400
    weeks = seconds // 604800

    if weeks:
        return f"{weeks} w"
    elif days:
        return f"{days} d"
    elif hours:
        return f"{hours} h"
    elif minutes:
        return f"{minutes} m"
    else:
        return f"{seconds} s"


def get_status(conditions):
    status = sorted(conditions, key=lambda x: x.last_transition_time, reverse=True)[0]
    if status.type == "Available":
        return "running"
    elif status.type == "Progressing" and status.status == "True":
        return "building"
    return "failed"


def filter_demos_by_name(demos, name):
    def matches(query, demo):
        return re.search(query, demo["name"], re.IGNORECASE)

    return (demo for demo in demos if matches(name, demo))


def update_pod_state(state, pod_name):
    if state == "delete":
        # Silence errors if any of the resources are not found.
        with suppress(client.ApiException):
            corev1.delete_namespaced_service(pod_name, "default")
        with suppress(client.ApiException):
            netv1.delete_namespaced_ingress(pod_name, "default")
        with suppress(client.ApiException):
            api.delete_namespaced_deployment(pod_name, "default")
    elif state == "restart":
        name = pod_name.replace("-demos-haus", ".demos.haus")
        pod = corev1.list_namespaced_pod(
            "default", watch=False, label_selector=f"app={name}"
        ).items[0]
        with suppress(client.ApiException):
            corev1.delete_namespaced_pod(pod.metadata.name, "default")


def get_deployment_status(name):
    deployment = api.read_namespaced_deployment(name, "default")
    return get_status(deployment.status.conditions)


def get_pr_url(labels):
    try:
        return f"https://github.com/{labels['github.org']}/{labels['github.repo']}/pull/{labels['github.pr']}"
    except KeyError:
        return ""
