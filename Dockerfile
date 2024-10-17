# syntax=docker/dockerfile:experimental

# Build stage: Install python dependencies
# ===
FROM ubuntu:noble AS python-dependencies
RUN apt-get update && apt-get install --no-install-recommends --yes python3-pip python3-setuptools
COPY requirements.txt /tmp/requirements.txt
RUN pip3 config set global.disable-pip-version-check true
RUN --mount=type=cache,target=/root/.cache/pip pip3 install --user --requirement /tmp/requirements.txt

# Build stage: Install yarn dependencies
# ===
FROM node:23 AS yarn-dependencies
WORKDIR /srv
COPY . .
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn yarn install

# Build stage: Run "yarn run build"
# ===
FROM yarn-dependencies AS build
RUN yarn run build

# Build the production image
# ===
FROM ubuntu:noble

ENV LANG C.UTF-8
WORKDIR /srv

# Install python and import python dependencies
RUN apt-get update && apt-get install --no-install-recommends --yes python3 python3-distutils python3-lib2to3 python3-pkg-resources ca-certificates
ENV PATH="/root/.local/bin:${PATH}"

# Copy python dependencies
COPY --from=python-dependencies /root/.local/lib/python3.8/site-packages /root/.local/lib/python3.8/site-packages
COPY --from=python-dependencies /root/.local/bin /root/.local/bin

# Import code, build assets
COPY . .
RUN rm -rf package.json yarn.lock .babelrc webpack.config.js requirements.txt
COPY --from=build /srv/static static

# Set build ID
ARG BUILD_ID
ENV TALISKER_REVISION_ID "${BUILD_ID}"


# Setup commands to run server
ENTRYPOINT ["./entrypoint"]
CMD ["0.0.0.0:80"]
