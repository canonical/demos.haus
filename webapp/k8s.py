import os
from distutils.util import strtobool

from kubernetes import config, client

# Load the config for to use the SDK
in_k8s_cluster = strtobool(os.getenv("IN_K8S_CLUSTER", "False"))
if in_k8s_cluster:
    config.load_incluster_config()
else:
    config.load_kube_config()


extensionsv1 = client.ExtensionsV1beta1Api()


def get_running_demos():
    ingresses = extensionsv1.list_namespaced_ingress("default", watch=False)
    demos = []
    for ingress in ingresses.items:
        if ingress.metadata.name != "k8s-demo-haus":
            demos.append({
                "name": ingress.metadata.name,
                "host": f"https://{ingress.spec.rules[0].host}"
            })

    return demos
